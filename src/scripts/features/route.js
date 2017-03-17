import {replace} from 'lodash/fp'
import {getIn, on, putIn, seq, isList} from 'prax'

import {parseLocation, onType, patchMask, meld} from '../utils'
import {journal, linkWithPersistence} from '../journal'

export const routePath                      = ['route']
export const actionPath                     = ['route', 'action']
export const hashPath                       = ['route', 'hash']
export const originPath                     = ['route', 'origin']
export const basenamePath                   = ['route', 'basename']
export const pathnamePath                   = ['route', 'pathname']
export const queryPath                      = ['route', 'query']
export const searchPath                     = ['route', 'search']

const queryListKeys = []

/**
 * Defaults
 */

exports.defaults = {
  route: null,
}

/**
 * Reducers
 */

const parseRoute = meld(parseLocation, patchMask({query: parseLocationQuery}))

exports.reducers = [
  onType('route', (state, {value}) => putRoutes(state, value)),
]

/**
 * Effects
 */

exports.effects = onType(/^route/, seq(
  on({type: 'route/push'}, ({state}, {value}) => {
    if (value !== relativeHref(getIn(state, routePath))) routePush(value)
  }),

  on({type: 'route/replace'}, ({state}, {value}) => {
    if (value !== relativeHref(getIn(state, routePath))) routeReplace(value)
  }),

  on({type: 'route/query/push'}, ({state}, {value}) => {
    journal.queryPush(getIn(state, routePath), value)
  }),

  on({type: 'route/query/replace'}, ({state}, {value}) => {
    journal.queryReplace(getIn(state, routePath), value)
  }),

  on({type: 'route/query/key-push'}, ({state}, {key, value}) => {
    journal.queryKeyPush(getIn(state, routePath), key, value)
  }),

  on({type: 'route/query/key-replace'}, ({state}, {key, value}) => {
    journal.queryKeyReplace(getIn(state, routePath), key, value)
  }),

  on({type: 'route'}, forceLayoutHeight),
))

/**
 * Watchers
 */

exports.watchers = []

/**
 * Utils
 */

function putRoutes (state, nextRoute) {
  return putIn(state, routePath, parseRoute(nextRoute))
}

function relativeHref ({href, origin, basename}) {
  const host = trimSlashes(origin) + trimSlashes(basename)
  return _.includes(href, host)
    ? trimSlashes(href.replace(host, ''))
    : null
}

const trimSlashes = replace(/^\/*|\/*$/g, '')

function parseLocationQuery (query) {
  return queryListKeys.reduce(maybeToList, query)
}

function maybeToList (query, key) {
  return putIn(query, [key], unit(query[key]))
}

function unit (value) {
  return value != null && !isList(value) ? [value] : value
}

function routePush (link) {
  journal.push(linkWithPersistence(link, journal.getCurrentLocation()))
}

function routeReplace (link) {
  journal.replace(linkWithPersistence(link, journal.getCurrentLocation()))
}

function forceLayoutHeight ({action}) {
  // Force height measurement to ensure proper scroll restoration when
  // navigating back and forward. This must be done after completely finishing
  // the rendering. Seems unnecessary in production build.
  if (window.developmentMode && action === 'POP') document.body.scrollHeight
}