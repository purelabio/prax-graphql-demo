import {defonce, getIn, global, isDict, on, testOr, Watcher,
  ifelse, validate, isFunction, bind, isNil, scan} from 'prax'
import {Xhr, eventToResult, xhrSetMultiCallback, jsonDecode} from 'purelib'
import {pathnamePath} from './route'
import {putThis} from '../utils'
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

  env.auth0Lock.on('authenticated', auth => {
    env.send({type: 'auth/authenticated', auth})
  })

  const storedAuth = localStorage.getItem('auth')
  if (storedAuth) env.send({type: 'auth/authenticated', auth: JSON.parse(storedAuth)})

  return () => {}
}

exports.defaults = {}

exports.reducers = [
  on({type: 'auth/authenticated'}, putThis('user', 'auth')),
  on({type: 'auth/signed-in'}, putThis('user', 'profile')),
  on({type: 'auth/scaphold'}, putThis('user', 'scaphold'))
]

exports.effects = [
  on(
    {type: 'auth/authenticated', auth: isDict},
    (__, {auth}) => localStorage.setItem('auth', JSON.stringify(auth))
  ),

  on(
    {type: 'auth/authenticated', auth: isDict},
    ({send, auth0Lock}, {auth: {accessToken}}) => {
      auth0Lock.getUserInfo(
        accessToken,
        (error, profile) => send({type: 'auth/signed-in', profile})
      )
    }
  ),

  on(
    {type: 'auth/authenticated', auth: isDict},
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

function xhrGraphql(env, body) {
  const scapholdId = scan(env.state, 'user', 'scaphold', 'loginUserWithAuth0', 'user', 'id')
  const xhr = Xhr({
    url: 'https://eu-west-1.api.scaphold.io/graphql/curved-robin',
    method: 'post',
    body: JSON.stringify(body),
    headers: _.omitBy({
      'Content-Type': 'application/json',
      'Authorization': scapholdId ? `Bearer ${scapholdId}` : null
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


