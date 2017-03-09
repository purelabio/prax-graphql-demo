import {useRouterHistory} from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {addQueryMethods, supportRelativePaths, forceOrderedHistory,
  findNode, getAttr, funnel} from 'purelib'

export const journal = funnel(createBrowserHistory, [
  useRouterHistory,
  addQueryMethods,
  supportRelativePaths,
  forceOrderedHistory,
])({
  basename: getAttr('href', findNode('base')),
})

window.app = {...window.app, journal}
