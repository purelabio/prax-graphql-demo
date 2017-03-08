import {split, join, filter, map, mapValues, chunk, replace, reverse, takeRight} from 'lodash-fp'
import {get, scan, getIn, putIn, equal, equalBy, merge, mergeBy,
  bind, defer, id, val, ifonly, ifthen, ifelse, and, or, not, cond, test, testBy, revise,
  pipe, spread, rest, is, di, includes, append, truthy, mask, fanout,
  isRegExp, isPrimitive, isList, isDict, isFunction, isNatural, validate, validateEach} from 'prax'
import {onlyString} from './format'
import {from, delIn} from './reduce'

export {merge} from 'prax'

export const True = val(true)
export const False = val(false)
export const Null = val(null)

// Reminder how it works:
//
//   /exp1|exp2|exp3/g        ->  [matchA, matchB, matchC, matchD, ...]
//   /(exp1)|(exp2)|(exp3)/g  ->  [matchA, matchB, matchC, matchD, ...]
//   /exp1|exp2|exp3/         ->  [matchN]
//   /(exp1)|(exp2)|(exp3)/   ->  [matchN, match1|undefined, match2|undefined, match3|undefined]
//
// When the regex has groups AND non-groups (sections without parens), results
// might not make sense.
export function match (reg, value) {
  return onlyString(value).match(reg)
}

export function nthMatch (index, reg, value) {
  validate(isRegExp, reg)
  return get(match(reg, value), index) || ''
}

// Only makes sense for non-global regs that consist entirely of desired capture
// groups.
export const firstMatch = bind(nthMatch, 0)

export const ifexists = bind(ifthen, id)

export function duplicates (list) {
  return _.filter(list, isDuplicate)
}

function isDuplicate (value, i, list) {
  return _.lastIndexOf(list, value) > i
}

// Same as `cond` but each predicate is wrapped in `test`.
export function condTest (...args) {
  return cond(...args.map(maybeTest))
}

function maybeTest (value, i) {
  return isEven(i) ? test(value) : value
}

function isEven (num) {
  return !(num % 2)
}

// ƒ(number) -> number | Infinity | -Infinity | NaN
// ƒ(string) -> number | Infinity | -Infinity | NaN
// ƒ(any)    -> NaN
//
// Unlike parseFloat, ignores extra arguments.
// Like parseFloat and unlike Number:
//  '' -> NaN
//  [] -> NaN
// Like Number and unlike parseFloat:
//   '1.2blah' -> NaN
// Like both:
//   '1.' -> 1
export const parseDecimal = cond(
  _.isNumber,          id,
  and(_.isString, id), Number,
  val(NaN)
)

export const parseMaybeDecimal = pipe(parseDecimal, ifelse(_.isFinite, id, Null))

export const parseDecimalOrEmpty = pipe(parseDecimal, ifelse(_.isFinite, id, val('')))

const maybeParseNum = ifonly(pipe(parseDecimal, _.isFinite), parseDecimal)

export function intersperse (fun, list) {
  return _(list)
    .initial()
    .map((value, index) => [value, fun(index)])
    .flatten()
    .concat(list.length ? _.last(list) : [])
    .value()
}

const isStringifiable = or(_.isString, _.isFinite)

export const strjoin = revise([id, filter(isStringifiable)], join)

// Problem:
//   JSON.stringify(null)       = 'null'
//   JSON.stringify(undefined)  = undefined
export function jsonEncode (value) {
  try {return JSON.stringify(value)}
  catch (_) {return 'null'}
}

// Problem:
//   JSON.parse('')                = exception!
//   JSON.parse(JSON.stringify())  = exception!
export function jsonDecode (value) {
  try {return JSON.parse(value)}
  catch (_) {return null}
}

// Caution: this is nowhere near 'universally' unique. In V8, this produces a
// duplicate in just 0.8e5 iterations on average.
export function uuid () {
  return Math.floor(Math.random() * Math.pow(10, 18)).toString(16)
}

export function listByCriteria (list, {filters, search, sortBy, sortOrder}) {
  return _.orderBy(
    searchCollection(search, _.reduce(_.values(filters), _.filter, list)),
    sortBy,
    sortOrder,
  )
}

export function searchCollection (searchText, collection) {
  return !searchText
    ? collection
    : _.filter(collection, treeTest(
      _.first(searchText) === '-' ?  _.every : _.some,
      and(notIdField, test(searchRegex(searchText)))
    ))
}

function notIdField (_value, key) {
  return key !== 'id'
}

function searchRegex (searchText) {
  return new RegExp((
    _.first(searchText) !== '-'
    ? _.escapeRegExp(searchText)
    : `^((?!${_.escapeRegExp(searchText.slice(1))}).)*$`
  ), 'i')
}

function treeTest (testCollection, testPrimitive) {
  validate(isFunction, testCollection)
  validate(isFunction, testPrimitive)
  return function testNode (value) {
    return isPrimitive(...arguments)
      ? testPrimitive(...arguments)
      : testCollection(value, testNode)
  }
}

export function criteriaToggleSort (fieldName, criteria) {
  const sortBy = scan(criteria, 'sortBy')
  const sortOrder = scan(criteria, 'sortOrder')
  const index = _.indexOf(sortBy, fieldName)

  return (
    !~index
    ? {sortBy: append(sortBy, fieldName), sortOrder: append(sortOrder, 'asc')}
    : scan(criteria, 'sortOrder', index) !== 'desc'
    ? {sortOrder: putIn(sortOrder, [index], 'desc')}
    : criteriaClearSort(...arguments)
  )
}

export function criteriaClearSort (fieldName, criteria) {
  const sortBy = scan(criteria, 'sortBy')
  const sortOrder = scan(criteria, 'sortOrder')
  const index = _.indexOf(sortBy, fieldName)

  return ~index
    ? {sortBy: removeAtIndex(sortBy, index), sortOrder: removeAtIndex(sortOrder, index)}
    : {}
}

export function removeAtIndex (value, index) {
  const list = _.slice(value)
  if (between(0, list.length - 1, index)) list.splice(index, 1)
  return list
}

export function getMany (collection, keys) {
  return _.compact(_.map(keys, bind(get, collection)))
}

export function interval (time, fun, ...args) {
  return bind(clearInterval, setInterval(fun, time, ...args))
}

export function timeout (time, fun, ...args) {
  return bind(clearTimeout, setTimeout(fun, time, ...args))
}

export function includesEvery (list, values) {
  return _.every(values, bind(includes, list))
}

export function fitIndex (index, length) {
  return (index + length) % length
}

export function guid () {
  let d = Date.now()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random()*16)%16 | 0
    d = Math.floor(d/16)
    return (c === 'x' ? r : (r&0x3|0x8)).toString(16)
  })
}

export function isPath (value) {
  return isList(value) && _.every(value, _.isString)
}

// Better name?
export function zoomArgs (path, fun) {
  validate(isPath, path)
  return modArgs(map(from(path)), fun)
}

// Better name?
const modArgs = revise([rest, spread], pipe)

export function shift1 (fun) {
  validate(isFunction, fun)
  return function shifted (__, ...args) {return fun(...args)}
}

export function compareAt (path, fun) {
  validate(isPath, path)
  validate(isFunction, fun)
  return function compareAt_ (_env, prev, next) {
    return fun(getIn(prev, path), getIn(next, path))
  }
}

export function changedAt (path) {
  return compareAt(path, isnt)
}

export const isnt = not(is)

export function between (min, max, num) {
  return num >= min && num <= max
}

// WTB better name
// Other suggestions: "fulfill", "evince", "embody", "manifest"
// This is semantically closer to "or" or "either"
// ƒ(value, fallback)
export const reify = ifonly(_.isNil, di)

export function deflate (fun, list, acc) {
  return _.reduce(list, fun, acc)
}

export const delPaths = defer(deflate, delIn)

export const vacate = ifonly(_.isEmpty, () => undefined)

// Server often sends garbage entities with near-identical mostly-zero ids.
export const isRealEntity = test({id: and(truthy, not(test(/00000000/)))})

// 'one=1; two=two; three='  ->  {one: 1, two: 'two', three: ''}
// 'blah'                    ->  {blah: null}
export const pairStringToDict = pipe(
  split(/;\s|;/),
  map(split('=')),
  filter(_.first),
  _.fromPairs,
  mapValues(maybeParseNum),
)

export const collectionToPairString = pipe(
  ifelse(_.isArray, chunk(2), _.toPairs),
  filter(_.first),
  map(join('=')),
  join('; ')
)

// Same as `_.map(list, fun)`, but also passes each previous result to `fun`.
// TODO more efficient version.
export function mapDependent (fun, list, prev) {
  if (!_.size(list)) return []
  const value = fun(_.head(list), prev)
  return [value, ...mapDependent(fun, _.tail(list), value)]
}

// Requires >= 1 values. Doesn't make sense with 0 values.
export function mergeSubset (...values) {
  return values.reduce(mergeOnlyEqual)
}

const mergeOnlyEqual = bind(mergeBy, ifelse(equal, id, Null))

export function meld () {
  return fanout(arguments, merge)
}

// TODO this should be the default behaviour of `mask`.
export const patchMask = pipe(mask, bind(meld, id))

export function indexFits (list, index) {
  return isNatural(index) && index >= 0 && index < _.size(list)
}

export const prune = pipe(onlyString, replace(/\s+/g, ' '))

export const metaTitles = pipe(map('title'), filter(_.isString), _.compact)

export const combineTitle = pipe(reverse, join(' | '))

export const combineShortTitle = pipe(takeRight(2), join(' | '))

// WTB better name
export function on2 (patternLeft, patternRight, fun) {
  validate(isFunction, fun)
  return function on2_ (left, right) {
    return testBy(patternLeft, left) && testBy(patternRight, right)
      ? fun(left, right)
      : left
  }
}

export function findSiblingsById (list, id) {
  const index = _.findIndex(list, {id})
  return {
    prev: get(list, index - 1),
    next: get(list, index + 1),
  }
}

export function isListSupersetBy (fun, {superset, subset}) {
  return (
    _.size(superset) >= _.size(subset) &&
    equalBy(fun, subset, _.take(superset, _.size(subset)))
  )
}

export function funnel (value, funs) {
  validateEach(isFunction, funs)
  return funs.reduce(callRight, value)
}

function callRight (value, fun) {
  return fun(value)
}

export const toList = cond(isList, id, isDict, _.values, emptyList)

function emptyList () {return []}

export function isInvalidDate (value) {
  return value instanceof Date && isNaN(value)
}
