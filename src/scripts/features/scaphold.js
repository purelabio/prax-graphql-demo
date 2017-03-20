import {scan, pipe, isNil, validate, isFunction, bind, Watcher} from 'prax'
import {Xhr, eventToResult, xhrSetMultiCallback, jsonDecode} from 'purelib'
import {Wsocket} from 'webbs'
import {scapholdUserIdPath} from './auth'
import {getf} from '../utils'

const scapholdUrl = 'eu-west-1.api.scaphold.io/graphql/curved-robin'

export function preinit (root, onDeinit) {
  root.ScapholdXhr = bind(ScapholdXhr, root)

  onDeinit(bind(deinitWs, root))

  return {
    state: {},

    watchers: [
      Watcher(read => {
        reinitWs(root, read('auth', 'meta', 'idToken'))
      }),
    ],
  }
}

/**
 * Graphql Request — Response
 */

export function ScapholdXhr (root, body) {
  const scapholdUserId = scan(root.store.state, scapholdUserIdPath)
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
  xhr.done(bind(root.que.push, bind(flushXhr, xhr)))
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

function reinitWs (root, idToken) {
  deinitWs(root)

  if (!idToken) return

  const ws = root.ws = Wsocket(`wss://${scapholdUrl}`, ['graphql-subscriptions'])

  ws.open()

  ws.onopen = function onopen () {
    console.info('Socket connected:', ws)
    ws._openedAt = Date.now()
    root.send({type: 'ws/opened'})
  }

  ws.onclose = function onclose (event) {
    const delta = Date.now() - ws._openedAt
    console.info(`Socket closed after ${delta}, reconnecting:`, event)
    root.send({type: 'ws/closed'})
  }

  ws.onerror = pipe(JSON.parse, err => {
    console.error(err)
    root.send({type: 'ws/err', err})
  })

  ws.onmessage = pipe(getf('data'), JSON.parse, ({type, ...msg}) => {
    console.info('Socket msg:', type, msg)
    root.send({type: `ws/msg/${type}`, ...msg})
  })
}

function deinitWs (root) {
  if (root.ws) {
    root.ws.close()
    root.ws = null
  }
}
