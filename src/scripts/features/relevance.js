import {putInBy, alter, pipe, prepend, ifelse, val, inc, validate, and,
  not, isFunction} from 'prax'
import {from, isPath, when, isLoggedIn} from '../utils'

exports.defaults = {
  relevant: null,
}

exports.reducers = []

exports.computers = []

exports.effects = []

exports.watchers = []

export function relevantAt (path) {
  validate(isPath, path)
  return pipe(from(relevancePrefix(path)), isPositive)
}

export function registerRelevantPaths (state, paths) {
  return paths.map(relevancePrefix).reduce(incrementIn, state)
}

export function deregisterRelevantPaths (state, paths) {
  return paths.map(relevancePrefix).reduce(decrementIn, state)
}

const relevancePrefix = alter(prepend, 'relevant')

function incrementIn (state, path) {
  return putInBy(state, path, incrementOrOne)
}

function decrementIn (state, path) {
  return putInBy(state, path, decrementOrNull)
}

function isPositive (value) {
  return _.isFinite(value) && value > 0
}

const incrementOrOne = ifelse(isPositive, inc, val(1))

function decrementOrNull (value) {
  return _.isFinite(value) && value > 1 ? value - 1 : null
}

export function whenRelevantAt (path, predicate, fun) {
  validate(isFunction, predicate)
  validate(isFunction, fun)
  return [
    when(
      and(isLoggedIn, relevantAt(path), predicate),
      fun
    ),
    when(
      and(isLoggedIn, relevantAt(path), not(from(path)), predicate),
      fun
    )
  ]
}
