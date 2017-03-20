const {Atom, TaskQue, getIn, putIn, extract, merge, bind, testOr,
  fuseModules, joinReducers} = require('prax')

const que = TaskQue()

export const root = {
  store: Atom(),
  reducers: [],
  effects: [],
  send: bind(que.push, function send (msg) {
    maybeLog(msg)
    root.store.swap(joinReducers(root.reducers), msg)
    root.effects.forEach(function runEffect (fun) {
      fun(root, msg)
    })
  }),
  que,
}

const isBoring = testOr({type: 'dom/post-render'}, {type: 'time/now'}, {type: 'dom/focus-change'})

function maybeLog (msg) {
  if (window.devMode && !isBoring(msg)) console.debug('[Event]:', msg)
}

export function reinit (features, root, onDeinit) {
  const {preinit, init} = fuseModules(features)

  const mods = preinit(root, onDeinit)

  root.effects = extract(['effects'], mods)

  root.store.watchers = extract(['watchers'], mods)

  root.store.state = merge(...extract(['state'], mods), root.store.state)

  // root.store.notifyWatchers(root.store.state, root.store.state)

  init(root, onDeinit)
}

/**
 * REPL
 */

window.app = {
  ...window.app,
  root,
  store: root.store,
  read () {
    return getIn(root.store.state, arguments)
  },
  set (...path) {
    root.store.swap(putIn, path, path.pop())
  },
}
