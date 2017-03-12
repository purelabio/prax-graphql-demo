import {global, defonce, isString, on, putAt} from 'prax'
import Auth0Lock from 'auth0-lock'

const AUTH0_LOCK_CONFIG = {
  clientId: 'fz3A7ALyhUquoHX5Z1YVGn8mj0sTQhwB',
  domain: 'purelabio.auth0.com'
}

export function setup (env) {
  env.auth0Lock = defonce(global, ['app', 'auth0Lock'], function init () {
    const {clientId, domain} = AUTH0_LOCK_CONFIG
    return new Auth0Lock(clientId, domain, {})
  })

  env.auth0Lock.on('authenticated', function ({accessToken}) {
    env.send({type: 'auth/access-token', accessToken})
  })

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) env.send({type: 'auth/access-token', accessToken: storedAccessToken})

  return () => {}
}

exports.defaults = {}

exports.reducers = [
  on({type: 'auth/signed-in'}, (state, {profile}) => putAt(['user', 'profile'], state, profile))
]

exports.effects = [
  on(
    {type: 'auth/access-token', accessToken: isString},
    (__, {accessToken}) => localStorage.setItem('accessToken', accessToken)
  ),

  on(
    {type: 'auth/access-token', accessToken: isString},
    ({send, auth0Lock}, {accessToken}) => {
      auth0Lock.getUserInfo(
        accessToken,
        (error, profile) => send({type: 'auth/signed-in', profile})
      )
    }
  ),
]

exports.watchers = []

