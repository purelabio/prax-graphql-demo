import {is, isFunction, validate} from 'prax'

export function watchWhen (predicate, watcher) {
  validate(isFunction, predicate)
  validate(isFunction, watcher)
  return function watchWhen_ (env, prev, next) {
    if (predicate(next)) watcher(...arguments)
  }
}

export function when (predicate, effect) {
  validate(isFunction, predicate)
  validate(isFunction, effect)
  let first = true
  return function when_ (env, prev, next) {
    const condition = predicate(next)
    if (condition && (first || !is(condition, predicate(prev)))) {
      first = false
      effect(env, condition)
    }
  }
}

export function whenPure (predicate, effect) {
  validate(isFunction, predicate)
  validate(isFunction, effect)
  return function whenPure_ (env, prev, next) {
    const condition = predicate(next)
    if (condition && !is(condition, predicate(prev))) effect(env, condition)
  }
}
