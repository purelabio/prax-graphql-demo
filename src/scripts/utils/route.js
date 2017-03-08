import {replace, split, map, pickBy, groupBy, mapValues, nth, join, filter,
  reverse} from 'lodash-fp'
import {getIn, bind, pipe, test, ifonly, not, fanout, procure,
  isDict, isFunction, isString, isList, validate, validateEach} from 'prax'
import {merge, firstMatch} from './utils'
import {onlyString} from './format'
import {from, getf} from './reduce'
import {isDynamicRoute} from './route-meta'

/**
 * Journal
 */

export function locationParser (paramConfig) {
  return fanout([parseLocation, bind(addLocationParams, paramConfig)], merge)
}

// Param config must be a map of keys to regexps:
//   paramConfig = {order: /orders\/([^/]+)/}
export function parseLocationParams (paramConfig, {pathname}) {
  return _.mapValues(paramConfig, reg => firstMatch(reg, pathname))
}

export function addLocationParams () {
  return {params: parseLocationParams(...arguments)}
}

export function parseLocation ({basename, pathname, search, hash}) {
  const {host, origin} = window.location

  return {
    query: parseQuery(search),
    path: pathname === '/' ? [''] : pathname.split('/'),
    host,
    origin,
    href: [origin, basename, pathname, search, hash].map(onlyString).join(''),
    domains: host.replace(/:\d+/g, '').split('.'),
    port: Number(firstMatch(/:(\d+)/, host)) || null
  }
}

export function addToQuery (location, key, value) {
  return patchQuery(location, {[key]: value})
}

// Expects `read('route')` or `window.location` as the first argument.
// Returns a URL with the given dictionary merged into the query.
export function patchQuery ({basename, pathname, query, search, hash}, patch) {
  return {
    pathname: basename === '/' ? (pathname || '/') : (pathname || '/').replace(basename, ''),
    query: _.omitBy({...(query || parseQuery(search)), ...patch}, _.isNil),
    hash,
  }
}

// Parses a URL-style query into a dict.
// Values of repeating keys are grouped into lists.
export const parseQuery = pipe(
  onlyString,
  replace(/^\?/, ''),
  split('&'),
  map(pipe(split('='), map(decode))),
  groupBy(nth(0)),
  mapValues(pipe(map(nth(1)), ifonly(test({length: 1}), _.head))),
  pickBy(Boolean)
)

// '+' is replaced by '%20' because react-router uses '+' as delimeter instead of %20 in query.
// It causes bugs related to displaying query params with '+' instead of space.
// https://github.com/reactjs/react-router/commit/d955d7a69052fd649b58d00bd75301a533f67e06
function decode (val) {
  return decodeURIComponent(val.replace(/\+/g, '%20'))
}

export function appendQuery (url, query) {
  const section = stringifyQuery(query)
  return !section ? url : `${url}${_.includes(url, '?') ? '&' : '?'}${section}`
}

function appendHash (url, hash) {
  return hash ? `${url}#${hash.replace(/^#/, '')}` : url
}

export function joinUrl (pathname, query, hash) {
  return appendHash(appendQuery(pathname, query), hash)
}

export function queryToPairs (query) {
  return _.flatten(_.map(query, valuePairs)).filter(valueExists)
}

const valueExists = pipe(nth(1), not(_.isNil))

function valuePairs (value, key) {
  return isList(value) ? _.map(value, val => [key, val]) : [[key, value]]
}

export const encodePair = pipe(map(encodeURIComponent), join('='))

export const stringifyQuery = pipe(queryToPairs, map(encodePair), join('&'))

export const getPath = from(['route', 'path'])

export function testRoutePath (pattern) {
  return pipe(getPath, test(pattern))
}

export const getPathname = from(['route', 'pathname'])

export function testRoutePathname (pattern) {
  return pipe(getPathname, test(pattern))
}

export function routeParam (key) {
  validate(isString, key)
  return getf('route', 'params', key)
}

export function routeQueryItem (key) {
  validate(isString, key)
  return getf('route', 'query', key)
}

/**
 * React-router
 */

export const getParamKeyList = pipe(
  getf('route', 'nav', 'routes'),
  filter(isDynamicRoute),
  map('path'),
  map(replace(':', '')),
  reverse,
)

export function getParamList (state) {
  return _.map(
    getParamKeyList(state),
    bind(_.pick, getIn(state, ['route', 'params']))
  )
}

export function procureByParam (config) {
  validate(isDict, config)
  validateEach(isFunction, _.values(config))

  return function procureByParam_ ({state}) {
    const params = getIn(state, ['route', 'params'])
    return procure(
      key => config[key] && config[key](params, state),
      getParamKeyList(state)
    )
  }
}
