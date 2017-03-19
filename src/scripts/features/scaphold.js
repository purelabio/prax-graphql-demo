import {pipe, scan, isNil, validate, isFunction, bind, Watcher} from 'prax'
import {Xhr, eventToResult, xhrSetMultiCallback, jsonDecode} from 'purelib'
import {Wsocket} from 'webbs'
import {scapholdIdPath} from './auth'
import {getf} from '../utils'

const scapholdUrl = 'eu-west-1.api.scaphold.io/graphql/curved-robin'

exports.defaults = {}

exports.reducers = []

exports.effects = []

exports.watchers = [
  Watcher(initWsOnAuth)
]

/**
 * Graphql Request — Response
 */

export function xhrGraphql(env, body) {
  const scapholdId = scan(env.state, scapholdIdPath)
  const xhr = Xhr({
    url: `https://${scapholdUrl}`,
    method: 'post',
    body: JSON.stringify(body),
    headers: _.omitBy({
      'Content-Type': 'application/json',
      Authorization: scapholdId ? `Bearer ${scapholdId}` : null
    }, isNil)
  })
  xhrSetMultiCallback(xhr, function onXhrDone (event) {
    xhr.result = parseResult(eventToResult(event))
  })
  xhr.done(bind(env.enque, bind(flushXhr, xhr)))
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

function initWsOnAuth (read, env) {
  if (env.ws) env.ws.close()

  const idToken = read('user', 'auth', 'idToken')
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

  ws.sendJSON = pipe(JSON.stringify, ws.send)
}