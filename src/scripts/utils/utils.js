import {Subber, bind, validate, isFunction} from 'prax'

export function Watcher (effect) {
  validate(isFunction, effect)

  return function initWatcher (env, onDeinit) {
    const subber = new Subber()

    onDeinit(subber.deconstructor)

    const reader = bind(effect, env)

    function rerun (subber) {
      subber.run(reader, rerun)
    }

    rerun(subber)

    return subber
  }
}
