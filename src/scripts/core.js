import {global, Atom, defonce,
        getIn, putIn, merge, bind, flat, seq, testOr, adjoin, remove, isFunction, validate,
        joinReducers, joinComputers} from 'prax'
import {storage, storageRead} from 'purelib'

/**
 * Env
 */

export const env = defonce(global, ['app', 'env'], Atom)

// Low-level state transition: pure-functional swap
// Also invokes computers

env.swap = function swapWithComp (mod, ...args) {
  return Atom.prototype.swap.call(env, function doSwapWithComp (prev) {
    return joinComputers(env.computers)(prev, mod(prev, ...args))
  })
}

// Events: Reducers -> Effects

const isBoring = testOr({type: 'dom/post-render'}, {type: 'time/now'}, {type: 'dom/focus-change'})

function maybeLog (msg) {
  if (window.developmentMode && !isBoring(msg)) console.debug('[Event]:', msg)
}

env.send = bind(env.enque, function send (msg) {
  maybeLog(msg)
  env.swap(joinReducers(env.reducers), msg)
  env.effects.forEach(function runEffect (fun) {
    fun(env, msg)
  })
})

env.addEffect = function addEffect (fun) {
  validate(isFunction, fun)
  env.effects = adjoin(env.effects, fun)
  return function removeEffect () {
    env.effects = remove(env.effects, fun)
  }
}

/**
 * Setup
 */

const extract = (features, key) => flat(features.map(x => x[key]).filter(Boolean))

export function featureSetup (env, features) {
  // Pure functions that create new state in response to events
  env.reducers = extract(features, 'reducers')

  // Pure functions that redefine app state as ƒ of itself.
  env.computers = extract(features, 'computers')

  // Side-effectful functions that react to events
  env.effects = extract(features, 'effects')

  // Side-effectful functions that react to data changes
  env.watchers = extract(features, 'watchers')

  // Initial state
  env.state = merge(...extract(features, 'defaults'), storageRead(storage, 'prax-graphql-demo', []), env.state)

  return seq(...extract(features, 'setup').map(fun => fun(env)).filter(isFunction))
}

/**
 * Debug
 */

window.app = {
  ...window.app, env,
  read () {
    return getIn(env.state, arguments)
  },
  set (...path) {
    env.swap(putIn, path, path.pop())
  }
}
