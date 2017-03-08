import {scan, getIn, getAt, putAt, patchAt, putIn,
  bind, id, pipe, di, defer, rest, fanout, on, validate} from 'prax'
import {strjoin, isPath} from './utils'

export function st (type, value) {
  return {type, value}
}

export function std (type, key, value) {
  return {type, key, value}
}

export function onType (type, fun) {
  return on({type}, fun)
}

export const from = defer(getAt)

export const getf = rest(from)

export const passValue = pipe(di, getf('value'))

export const stf = defer(st)

export const stdf = defer(std)

export function putTo (path, fun) {
  return fanout([id, fun], bind(putAt, path))
}

export function patchTo (path, fun) {
  return fanout([id, fun], bind(patchAt, path))
}

export function putOne (path, fun) {
  return function putOne_ (state, event) {
    return (
      event && event.key
      ? putAt([...path, event.key], state, fun(state, event))
      : state
    )
  }
}

export function patchOne (path, fun) {
  return function patchOne_ (state, event) {
    return (
      event && event.key
      ? patchAt([...path, event.key], state, fun(state, event))
      : state
    )
  }
}

export function delIn (value, path) {
  return putIn(value, path, null)
}

export const isLoggedIn = pipe(getf('session'), Boolean)

export function fullName (fields) {
  return strjoin(' ', [scan(fields, 'firstName'), scan(fields, 'lastName')])
}

export function addFullName (fields) {
  return {_fullName: fullName(fields), ...fields}
}

export function zoomTo (path, fun) {
  return putTo(path, function zoomTo_ (state, event) {
    return fun(getIn(state, path), event)
  })
}

export function undoAt (state, valuePath, formPath) {
  validate(isPath, valuePath)
  validate(isPath, formPath)

  return getIn(state, valuePath) != null
    ? putIn(state, valuePath, null)
    : putIn(state, formPath, null)
}
