import {isString, validate} from 'prax'
import {from, getf} from 'purelib'

export const getPath = from(['route', 'path'])

export function routeQueryItem (key) {
  validate(isString, key)
  return getf('route', 'query', key)
}
