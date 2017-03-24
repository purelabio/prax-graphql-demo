import {Atom, TaskQue, PraxComponent, putIn, extract, fuseModules, joinReducers,
  bind, merge, testOr} from 'prax'

const que = new TaskQue()

export const env = {
  que,
  store: new Atom(),
  effects: [],
  send: bind(que.push, function send (msg) {
    maybeLog(msg)
    env.store.swap(joinReducers(env.reducers), msg)
    env.effects.forEach(function runEffect (fun) {
      fun(env, msg)
    })
  }),
}

const isBoring = testOr({type: 'dom/post-render'}, {type: 'time/now'}, {type: 'dom/focus-change'})

function maybeLog (msg) {
  if (window.devMode && !isBoring(msg)) console.debug('[Event]:', msg)
}

// Global hack
PraxComponent.prototype.env = env

export function reinit (lifecycler, features, env, onDeinit) {
  const {init} = fuseModules(features)

  env.reducers = extract(['reducers'], features)

  env.effects = extract(['effects'], features)

  env.store.state = merge(...extract(['defaultState'], features), lifecycler.lastState)

  onDeinit(() => {
    lifecycler.lastState = env.store.state
  })

  env.watchers = extract(['watchers'], features).map(initWatcher => (
    initWatcher(env, onDeinit)
  ))

  init(env, onDeinit)
}

/**
 * REPL
 */

window.app = {
  ...window.app,
  env,
  store: env.store,
  read (query) {
    return env.store.read(query)
  },
  set (path, value) {
    env.store.swap(putIn, path, value)
  },
}
