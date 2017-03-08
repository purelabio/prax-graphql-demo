import {pipe, test, isList, isString, validate} from 'prax'

export function readAt (path) {
  validate(isList, path)
  return function readAt_ (read) {return read(...path)}
}

export const readIsLoggedIn = pipe(readAt(['session']), Boolean)

export const readPath = readAt(['route', 'path'])

export function testReadPath (pattern) {
  return pipe(readPath, test(pattern))
}

export const readPathname = readAt(['route', 'pathname'])

export function testReadPathname (pattern) {
  return pipe(readPathname, test(pattern))
}

export function readRouteParam (key) {
  validate(isString, key)
  return readAt(['route', 'params', key])
}

export function readRouteQueryItem (key) {
  validate(isString, key)
  return readAt(['route', 'query', key])
}

export function readLocation (read) {
  return {
    pathname: read('route', 'pathname'),
    query: read('route', 'query'),
    hash: read('route', 'hash'),
  }
}
