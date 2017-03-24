import {each} from 'lodash/fp'
import {defonce, getIn, putIn, putInBy, testOr, isDict, on} from 'prax'
import {pathnamePath} from './nav'
import {jsonDecode, jsonEncode, xhrDestroy, Watcher} from '../utils'
import Auth0Lock from 'auth0-lock'
import {ScapholdXhr} from './scaphold'

const AUTH0_LOCK_CONFIG = {
  clientId: 'fz3A7ALyhUquoHX5Z1YVGn8mj0sTQhwB',
  domain: 'purelabio.auth0.com',
}

// This must be passed to `.show()`. If this is not specified, redirect breaks
// when authing from any non-root page. If this is passed to the constructor,
// authentication breaks completely.
export const auth0ShowConfig = {auth: {redirectUrl: `${window.location.origin}`}}

export const authMetaPath        = ['auth', 'meta']
export const userPath            = ['auth', 'user']
export const scapholdMetaPath    = ['auth', 'scapholdMeta']
export const authSyncPath        = ['auth', 'sync']
export const scapholdUserIdPath  = ['auth', 'scapholdMeta', 'loginUserWithAuth0', 'user', 'id']

export const defaultState = {
  auth: void {
    meta: null,
    user: null,
    scapholdMeta: null,
    sync: {
      user: null,
      scapholdUser: null,
    },
  },
}

export const effects = [
  on({type: 'auth/meta', value: isDict}, ({store, send, auth0Lock}, {value}) => {
    console.info('auth meta:', value)
    localStorage.setItem('authMeta', jsonEncode(value))
    store.swap(putIn, authMetaPath, value)
  }),

  on({type: 'auth/meta', value: isDict}, ({store, send, auth0Lock}, {value}) => {
    const path = [...authSyncPath, 'meta']
    const oldReq = getIn(store.state, path)
    if (oldReq) oldReq.abort()

    const req = auth0Lock.getUserInfo(
      value.accessToken,
      (err, value) => {
        store.swap(putIn, path, null)
        if (err) {
          console.warn(err)
        }
        else {
          send({type: 'auth/user', value})
        }
      }
    )

    store.swap(putIn, path, req)
  }),

  on({type: 'auth/meta', value: isDict}, (env, {value: {idToken}}) => {
    const {store, send} = env
    const path = [...authSyncPath, 'scapholdMeta']

    const oldReq = getIn(store.state, path)
    if (oldReq) oldReq.abort()

    const req = ScapholdXhr(env, loginParams(idToken))
      .onDone(result => {
        store.swap(putIn, path, null)
        if (result.ok) {
          send({type: 'auth/scaphold-meta', value: result.body.data})
        }
      })
      .start()

    store.swap(putIn, path, req)
  }),

  on({type: 'auth/user'}, ({store}, {value}) => {
    console.info('user info:', value)
    store.swap(putIn, userPath, value)
  }),

  on({type: 'auth/scaphold-meta'}, ({store}, {value}) => {
    console.info('scaphold auth info:', value)
    store.swap(putIn, scapholdMetaPath, value)
  }),

  on({type: 'auth/logout'}, ({store}) => {
    store.swap(putInBy, authSyncPath, each(xhrDestroy))
    store.swap(putIn, ['auth'], null)
  }),

  on({type: 'auth/show'}, ({auth0Lock}) => {
    auth0Lock.show(auth0ShowConfig)
  }),
]

export const watchers = [
  Watcher((env, {read}) => {
    const user = read(env.store, userPath)
    const pathname = read(env.store, pathnamePath)
    if (user && testOr(...publicPathnames)(pathname)) {
      env.send({type: 'nav/replace', value: {pathname: '/channels'}})
    }
    else if (!user && !testOr(...publicPathnames)(pathname)) {
      env.send({type: 'nav/replace', value: {pathname: '/'}})
    }
  }),
]

export function init (env, onDeinit) {
  const auth0Lock = defonce(env, ['auth0Lock'], function initAuth0Lock () {
    const {clientId, domain} = AUTH0_LOCK_CONFIG
    return new Auth0Lock(clientId, domain, {})
  })

  function authed (authMeta) {
    env.send({type: 'auth/meta', value: authMeta})
  }

  auth0Lock.on('authenticated', authed)

  onDeinit(() => {
    auth0Lock.removeListener('authenticated', authed)
  })

  const meta = jsonDecode(localStorage.getItem('authMeta'))

  if (meta) env.send({type: 'auth/meta', value: meta})
}

const publicPathnames = [
  '/',
  /users\/(?:sign-up|sign-in|recover)/,
]

function loginParams (idToken) {
  return {
    operationName: 'loginUser',
    query: `
      mutation loginUser ($credential: LoginUserWithAuth0Input!) {
        loginUserWithAuth0(input: $credential) {
          user {
            id
            username
            createdAt
            modifiedAt
            lastLogin
            roles {
              edges {
                accessLevel
              }
            }
          }
        }
      }
    `,
    variables: {
      credential: {
        idToken
      }
    }
  }
}
