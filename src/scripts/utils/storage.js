import {getIn, putIn, Watcher, isString, isObject, validate, validateEach} from 'prax'
import {jsonDecode, jsonEncode} from './utils'

/**
 * Notes
 *
 * Accessing localStorage may throw an error depending on browser / device /
 * browsing mode. For instance, writing to LS throws in Safari (iOS / OS X) in
 * private mode. We ignore all storage errors.
 */

try {exports.storage = localStorage}
catch (err) {
  if (window.developmentMode) {
    console.warn('Failed to initialise localStorage:', err)
  }
  exports.storage = {}
}

export function storagePersist (storage, path, data) {
  try {
    storage.scribe = jsonEncode(putIn(storageRead(storage, []), path, data))
  } catch (err) {
    if (window.developmentMode) {
      console.warn('Failed to save to storage:', err)
    }
  }
}

export function storageRead (storage, path) {
  try {return getIn(jsonDecode(storage.scribe), path)}
  catch (err) {
    if (window.developmentMode) {
      console.warn('Failed to read from storage:', err)
    }
    return null
  }
}

export function storageAutoPersist (storage, path) {
  validate(isObject, storage)
  validateEach(isString, path)
  return Watcher(read => {
    storagePersist(storage, path, read(...path))
  })
}
