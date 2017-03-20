const {Atom, TaskQue, getIn, putIn, extract, merge, bind, testOr,
  fuseModules, joinReducers} = require('prax')

const que = TaskQue()

export const env = {
  store: Atom(),
  reducers: [],
  effects: [],
  send: bind(que.push, function send (msg) {
    maybeLog(msg)
    env.store.swap(joinReducers(env.reducers), msg)
    env.effects.forEach(function runEffect (fun) {
      fun(env, msg)
    })
  }),
  que,
}

const isBoring = testOr({type: 'dom/post-render'}, {type: 'time/now'}, {type: 'dom/focus-change'})

function maybeLog (msg) {
  if (window.devMode && !isBoring(msg)) console.debug('[Event]:', msg)
}

export function reinit (features, env, onDeinit) {
  const {init} = fuseModules(features)

  env.reducers = extract(['reducers'], features)

  env.effects = extract(['effects'], features)

  env.watchers = extract(['watchers'], features)

  env.store.watchers = [function envWatcher (store, prev, next) {
    env.watchers.forEach(function notifyWatcher (watcher) {
      watcher(env, prev, next)
    })
  }]

  env.store.state = merge(...extract(['state'], features), env.store.state)

  env.store.notifyWatchers(env.store.state, env.store.state)

  init(env, onDeinit)
}

/**
 * REPL
 */

window.app = {
  ...window.app,
  env,
  store: env.store,
  read () {
    return getIn(env.store.state, arguments)
  },
  set (...path) {
    env.store.swap(putIn, path, path.pop())
  },
}
