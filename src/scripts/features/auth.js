import {or, pipe, id, revise} from 'prax'
import {storage, storageAutoPersist, readAt, from, delPaths} from '../utils'

export const authFormPath      = ['forms', 'auth']
export const usernamePath      = ['forms', 'auth', 'username']
export const passwordPath      = ['forms', 'auth', 'password']
export const errorMsgPath      = ['forms', 'auth', 'errorMsg']
export const authHttpPath      = ['http', 'auth']
export const sessionPath       = ['session']
export const sessionIdPath     = ['session', 'sessionId']
export const userIdPath        = ['session', 'userId']
export const userRolesPath     = ['session', 'userRoles']

const sessionXhrPath           = ['http', 'auth', 'session']
const loginXhrPath             = ['http', 'auth', 'login']
const logoutXhrPath            = ['http', 'auth', 'logout']

export const readSyncingAuth = or(
  readAt(sessionXhrPath),
  readAt(loginXhrPath),
  readAt(logoutXhrPath),
)

// TODO `Root` should render spinner in this state.
export const readWaitingForSession = pipe(readAt(sessionXhrPath), Boolean)

const privatePaths = [sessionPath, ['forms']]

exports.defaults = {
  session: void {
    userId: '<uuid>',
    sessionId: '<uuid>',
    firstName: '',
    lastName: '',
  },
  forms: {
    auth: {
      username: null,
      password: null,
      errorMsg: null,
    },
  },
  http: {
    auth: {
      session: null,
      login: null,
      logout: null,
    }
  }
}

exports.reducers = []

exports.effects = []

exports.watchers = [
  storageAutoPersist(storage, 'prax-graphql-demo', sessionPath),
]

/**
 * Utils
 */

export function syncLogin (env, username, password) {}

export function syncLogout (env) {}

export const hasRole = revise([from(userRolesPath), id], _.includes)

export const readHasRole = revise([readAt(userRolesPath), id], _.includes)

export function localLogout (env) {
  env.swap(delPaths(privatePaths))
}
