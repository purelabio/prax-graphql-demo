import {replace} from 'lodash/fp'
import {getIn, on, putIn, seq} from 'prax'

import {parseLocation} from '../utils'
import {journal} from '../journal'

export const navPath           = ['nav']
export const locationPath      = ['nav', 'location']
export const pathnamePath      = ['nav', 'location', 'pathname']

export const defaultState = {
  nav: null,
}

export const effects = on({type: /nav/}, seq(
  on({type: 'nav'}, ({store}, {value: {location, ...nav}}) => {
    store.swap(putIn, ['nav'], {...nav, location: parseLocation(location)})
  }),

  on({type: 'nav/push'}, ({store: {state}}, {value}) => {
    const location = getIn(state, locationPath)
    if (!location || value !== relativeHref(location)) journal.push(value)
  }),

  on({type: 'nav/replace'}, ({store: {state}}, {value}) => {
    const location = getIn(state, locationPath)
    if (!location || value !== relativeHref(location)) journal.replace(value)
  }),

  on({type: 'nav/query/push'}, ({store: {state}}, {value}) => {
    journal.queryPush(getIn(state, locationPath), value)
  }),

  on({type: 'nav/query/replace'}, ({store: {state}}, {value}) => {
    journal.queryReplace(getIn(state, locationPath), value)
  }),

  on({type: 'nav/query/key-push'}, ({store: {state}}, {key, value}) => {
    journal.queryKeyPush(getIn(state, locationPath), key, value)
  }),

  on({type: 'nav/query/key-replace'}, ({store: {state}}, {key, value}) => {
    journal.queryKeyReplace(getIn(state, locationPath), key, value)
  }),

  on({type: 'nav'}, forceLayoutHeight),
))

function relativeHref ({href, origin, basename}) {
  const host = trimSlashes(origin) + trimSlashes(basename)
  return _.includes(href, host)
    ? trimSlashes(href.replace(host, ''))
    : null
}

const trimSlashes = replace(/^\/*|\/*$/g, '')

function forceLayoutHeight ({action}) {
  // Force height measurement to ensure proper scroll restoration when
  // navigating back and forward. This must be done after completely finishing
  // the rendering. Seems unnecessary in production build.
  if (window.devMode && action === 'POP') document.body.scrollHeight
}
