import {scan, pipe, isNil, validate, isFunction, bind} from 'prax'
import {Xhr, eventToResult, xhrSetMultiCallback, jsonDecode} from 'purelib'
import {Wsocket} from 'webbs'
import {scapholdUserIdPath} from './auth'
import {getf, Watcher} from '../utils'

const scapholdUrl = 'eu-west-1.api.scaphold.io/graphql/curved-robin'

export const defaultState = {}

export const watchers = [
  Watcher((env, read) => {
    reinitWs(env, read('auth', 'meta', 'idToken'))
  }),
]

export function init (env, onDeinit) {
  onDeinit(bind(deinitWs, env))
}

/**
 * Graphql Request — Response
 */

export function ScapholdXhr (env, body) {
  const scapholdUserId = scan(env.store.state, scapholdUserIdPath)
  const xhr = Xhr({
    url: `https://${scapholdUrl}`,
    method: 'post',
    body: JSON.stringify(body),
    headers: _.omitBy({
      'Content-Type': 'application/json',
      Authorization: scapholdUserId ? `Bearer ${scapholdUserId}` : null
    }, isNil)
  })
  xhrSetMultiCallback(xhr, function onXhrDone (event) {
    xhr.result = parseResult(eventToResult(event))
  })
  xhr.done(bind(env.que.push, bind(flushXhr, xhr)))
  xhr.callbacks = []
  xhr.done = function xhrDone (fun) {
    validate(isFunction, fun)
    xhr.callbacks.push(fun)
    return xhr
  }
  return xhr
}

function flushXhr (xhr) {
  try {
    while (xhr.callbacks.length) xhr.callbacks.shift().call(xhr, xhr.result)
  }
  catch (err) {
    flushXhr(xhr)
    throw err
  }
}

function parseResult (result) {
  const body = jsonDecode(result.xhr.responseText)
  return {...result, body}
}

/**
 * Ws utils
 */

function reinitWs (env, idToken) {
  deinitWs(env)

  if (!idToken) return

  const ws = env.ws = Wsocket(`wss://${scapholdUrl}`, ['graphql-subscriptions'])

  ws.open()

  ws.onopen = function onopen () {
    console.info('Socket connected:', ws)
    ws._openedAt = Date.now()
    env.send({type: 'ws/opened'})
  }

  ws.onclose = function onclose (event) {
    const delta = Date.now() - ws._openedAt
    console.info(`Socket closed after ${delta}, reconnecting:`, event)
    env.send({type: 'ws/closed'})
  }

  ws.onerror = pipe(JSON.parse, err => {
    console.error(err)
    env.send({type: 'ws/err', err})
  })

  ws.onmessage = pipe(getf('data'), JSON.parse, ({type, ...msg}) => {
    console.info('Socket msg:', type, msg)
    env.send({type: `ws/msg/${type}`, ...msg})
  })
}

function deinitWs (env) {
  if (env.ws) {
    env.ws.close()
    env.ws = null
  }
}
