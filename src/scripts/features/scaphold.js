import {pipe, bind, RenderQue} from 'prax'
import {Xhr, eventToResult, xhrFlushCallbacks} from 'xhttp'
import {Webbs} from 'webbs'
import {getf, Watcher} from '../utils'

const scapholdUrl = 'eu-west-1.api.scaphold.io/graphql/curved-robin'

export const defaultState = {}

export const watchers = [
  Watcher((env, {read}) => {
    reinitWs(env, read(env.store, ['auth', 'meta', 'idToken']))
  }),
]

export function init (env, onDeinit) {
  onDeinit(bind(deinitWs, env))
}

/**
 * Graphql Request — Response
 */

export function ScapholdXhr (env, body) {
  const idToken = env.store.read(['auth', 'meta', 'idToken'])
  return Xhr({
    url: `https://${scapholdUrl}`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(idToken ? {Authorization: `Bearer ${idToken}`} : null),
    },
    body,
  }, onXhrDone)
}

function onXhrDone (event) {
  this.result = eventToResult(event)
  RenderQue.globalRenderQue.dam()
  try {
    xhrFlushCallbacks(this, this.result)
  } finally {
    RenderQue.globalRenderQue.flush()
  }
}

/**
 * Ws utils
 */

function reinitWs (env, idToken) {
  deinitWs(env)

  if (!idToken) return

  const ws = env.ws = new Webbs(`wss://${scapholdUrl}`, 'graphql-subscriptions')

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
