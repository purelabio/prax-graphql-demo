import {cursorsChanged, getIn, validate, isFunction} from 'prax'

export function Watcher (reader) {
  validate(isFunction, reader)

  let paths

  return function watcher (ref, prev, next) {
    if (paths && !cursorsChanged(paths, prev, next)) return

    paths = []
    let sync = true

    function read () {
      if (sync) paths.push(arguments)
      return getIn(next, arguments)
    }

    try {
      reader(ref, read)
    }
    finally {
      sync = false
    }
  }
}
