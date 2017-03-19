import {isString, validate, pipe, test} from 'prax'
import {from, getf} from 'purelib'

export const getPath = from(['route', 'path'])

export function testRoutePath (pattern) {
  return pipe(getPath, test(pattern))
}

export function routeQueryItem (key) {
  validate(isString, key)
  return getf('route', 'query', key)
}

export function appendQuery (url, query) {
  const section = stringifyQuery(query)
  return !section ? url : `${url}${_.includes(url, '?') ? '&' : '?'}${section}`
}

export function stringifyQuery (query) {
  return _.map(_.omitBy(query, _.isNil), encodePair).join('&')
}

function encodePair (value, key) {
  return encodeURIComponent(key) + '=' + value
}
