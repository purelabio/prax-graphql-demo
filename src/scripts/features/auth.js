import {defonce, getIn, global, isDict, on, testOr, Watcher,
  ifelse} from 'prax'
import {pathnamePath} from './route'
import {putThis} from '../utils'
import Auth0Lock from 'auth0-lock'
import {xhrGraphql} from './scaphold'

export const scapholdIdPath = ['user', 'scaphold', 'loginUserWithAuth0', 'user', 'id']

const AUTH0_LOCK_CONFIG = {
  clientId: 'fz3A7ALyhUquoHX5Z1YVGn8mj0sTQhwB',
  domain: 'purelabio.auth0.com'
}

export function setup (env) {
  env.auth0Lock = defonce(global, ['app', 'auth0Lock'], function init () {
    const {clientId, domain} = AUTH0_LOCK_CONFIG
    return new Auth0Lock(clientId, domain, {})
  })

  env.auth0Lock.on('authenticated', auth => {
    env.send({type: 'auth/success', auth})
  })

  const storedAuth = localStorage.getItem('auth')
  if (storedAuth) env.send({type: 'auth/success', auth: JSON.parse(storedAuth)})

  return () => {}
}

exports.defaults = {}

exports.reducers = [
  on({type: 'auth/success'}, putThis('user', 'auth')),
  on({type: 'auth/profile'}, putThis('user', 'profile')),
  on({type: 'auth/scaphold'}, putThis('user', 'scaphold'))
]

exports.effects = [
  on(
    {type: 'auth/success', auth: isDict},
    (__, {auth}) => localStorage.setItem('auth', JSON.stringify(auth))
  ),

  on(
    {type: 'auth/success', auth: isDict},
    ({send, auth0Lock}, {auth: {accessToken}}) => {
      auth0Lock.getUserInfo(
        accessToken,
        (error, profile) => send({type: 'auth/profile', profile})
      )
    }
  ),

  on(
    {type: 'auth/success', auth: isDict},
    (env, {auth: {idToken}}) => {
      xhrGraphql(env, loginParams(idToken))
        .done(({body: {data}}) => {
          env.send({type: 'auth/scaphold', scaphold: data})
        })
        .start()
    }
  )
]

exports.watchers = [
  Watcher(
    ifelse(
      read => read('user', 'profile'),
      maybeRedirectIn,
      maybeRedirectOut
    )
  )
]

const publicPathnames = [
  '/',
  /users\/(?:sign-up|sign-in|recover)/,
]

function maybeRedirectIn (__, env) {
  if (testOr(...publicPathnames)(getIn(env.state, pathnamePath))) {
    env.send({type: 'route/replace', value: {pathname: '/chats'}})
  }
}

function maybeRedirectOut (__, env) {
  if (!testOr(...publicPathnames)(getIn(env.state, pathnamePath))) {
    // env.send({type: 'route/replace', value: {pathname: '/'}})
  }
}

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