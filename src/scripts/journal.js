import {useRouterHistory} from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {merge} from 'prax'
import {addQueryMethods, supportRelativePaths, forceOrderedHistory,
  findNode, getAttr, funnel, linkToDict} from 'purelib'

export * from 'purelib/utils/journal'

// Selective URL persistence. Not relevant anymore?
export const persistentQueryKeys = []

export function linkWithPersistence (link, {query}) {
  return merge(
    {query: _.pick(query, persistentQueryKeys)},
    linkToDict(link)
  )
}

export const journal = funnel(createBrowserHistory, [
  useRouterHistory,
  addQueryMethods,
  supportRelativePaths,
  forceOrderedHistory,
])({
  basename: getAttr('href', findNode('base')),
})

window.app = {...window.app, journal}
