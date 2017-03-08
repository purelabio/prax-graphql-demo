import {replace} from 'lodash-fp'
import {bind} from 'prax'
import {firstMatch} from './utils'

/**
 * General
 */

export const cookiesUnavailable = (
  !document.cookie && (document.cookie = 'blah=blah', !document.cookie)
)

deleteCookie('blah')

export function getCookie (key) {
  return stripQuotes(firstMatch(new RegExp(`${key}=([^;]*)`), document.cookie))
}

const stripQuotes = replace(/^"(.*)"$/, '$1')

export function deleteCookie (key) {
  const hostname = window.location.hostname
  const config = `${key}=; expires="${new Date().toUTCString()}";`
  document.cookie = config
  document.cookie = `${config} path=/;`
  document.cookie = `${config} path=/; domain=${hostname};`
  document.cookie = `${config} path=/; domain=.${hostname};`
}

/**
 * Scribe-specific
 */

// Note: `ss-webapi-token` is required for all requests except login and logout,
// even for session recovery, but it's HTTP-only so we can't get our hands on it.

export const getCookieSessionId = bind(getCookie, 'ss-webapi-sid')
