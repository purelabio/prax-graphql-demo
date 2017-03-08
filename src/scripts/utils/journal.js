import {TaskQue, bind, pipe, isDict} from 'prax'
import {useRouterHistory} from 'react-router'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import {patchQuery, addToQuery} from './route'
import {merge, patchMask} from './utils'

export const journal = useRouterHistory(createBrowserHistory)({
  basename: '/'
})

// Selective URL persistence. Not relevant anymore?

export const persistentQueryKeys = ['districtId', 'schoolId', 'teacherId']

export function linkToDict (link) {
  return isDict(link) ? link : {pathname: link}
}

export function linkWithPersistence (link, {query}) {
  return merge(
    {query: _.pick(query, persistentQueryKeys)},
    linkToDict(link)
  )
}

// Linearise methods to prevent out-of-order notifications when redirecting
// (internal issue in the 'history' library).

const que = TaskQue()

const clampLink = pipe(linkToDict, patchMask({pathname: clampRelativePath}))

journal.transitionTo = bind(que.push, pipe(clampLink, journal.transitionTo))
journal.push         = bind(que.push, pipe(clampLink, journal.push))
journal.replace      = bind(que.push, pipe(clampLink, journal.replace))
journal.go           = bind(que.push, journal.go)
journal.goBack       = bind(que.push, journal.goBack)
journal.goForward    = bind(que.push, journal.goForward)

// Extra utils

export const journalQueryPush       = pipe(patchQuery, journal.push)
export const journalQueryReplace    = pipe(patchQuery, journal.replace)
export const journalQueryKeyPush    = pipe(addToQuery, journal.push)
export const journalQueryKeyReplace = pipe(addToQuery, journal.replace)

function clampRelativePath (path) {
  return /[^./]*\/\.\.\//.test(path) ? clampRelativePath(path.replace(/[^./]*\/\.\.\//, '')) : path
}

window.app = {...window.app, journal}
