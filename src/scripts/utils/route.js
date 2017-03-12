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

