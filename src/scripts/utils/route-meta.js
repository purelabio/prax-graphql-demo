import {filter, map, join, replace} from 'lodash-fp'
import {get, scan, bind, append, prepend, and, not, testOr, pipe, test, truthy, falsy} from 'prax'
import {vacate, patchMask} from './utils'

// active routes:     A --> C --> G
// children:           B     E     H
//                     C     F     I
//                     D     G
export function getRouteMetas (namedArgs) {
  const {routes} = namedArgs
  // WTF
  return _.reduceRight(routes, (metasSoFar, route, i) => (
    prepend(metasSoFar, nestedMeta(route, namedArgs, routes.slice(0, i + 1), metasSoFar[0]))
  ), [])
}

// ƒ(getRouteMetas(...))
export function squashIndexMetas (metas) {
  return _.reduceRight(metas, maybeSquash, [])
}

function maybeSquash ([next, ...metas], prev) {
  return !next
    ? [prev, ...metas]
    : isIndexMeta(prev)
    ? [{...prev, link: next.link}, ...metas]
    : [prev, next, ...metas]
}

// WTF
function nestedMeta (route, namedArgs, routesSoFar, nextMeta) {
  const absPath = interpretPath(joinRoutePaths(routesSoFar), namedArgs.params)
  const active = _.includes(namedArgs.routes, route)

  return {
    absPath,
    link: absPath,
    route,
    active,
    children: vacate(_.map(route.childRoutes, route => (
      nextMeta && nextMeta.route === route
      ? nextMeta
      : nestedMeta(route, namedArgs, append(routesSoFar, route))
    ))),
    ...maybeRouteMeta({...namedArgs, route, absPath, active}),
  }
}

function interpretPath (pathTemplate, params) {
  const templateKeys = _.map(pathTemplate.match(/:([^/]+)/g), replace(':', ''))
  return templateKeys.every(bind(get, params))
    ? pathTemplate.replace(/:([^/]+)/g, (__, key) => params[key])
    : null
}

const joinRoutePaths = pipe(
  map('path'),
  filter(and(_.isString, not(testOr('', '/', '*')))),
  join('/'),
)

export function maybeRouteMeta (namedArgs) {
  const getMeta = scan(namedArgs, 'route', 'getMeta')
  return _.isFunction(getMeta) ? getMeta(namedArgs) : null
}

export function extractDynamicRoutes (read) {
  return _.filter(
    getRouteMetas({...read('route', 'nav'), read}),
    and(isVisibleMeta, isDynamicRouteMeta)
  )
}

export const isDynamicRoute = test({path: /:/})

export const isDynamicRouteMeta = test({route: isDynamicRoute})

export const isVisibleMeta = test({title: truthy, disabled: falsy})

export const visibleMetaLists = pipe(map('children'), map(filter(isVisibleMeta)), filter(_.size))

export function visibleMetas (metas) {
  return _.map(_.filter(metas, isVisibleMeta), visibleChildMetas)
}

const visibleChildMetas = patchMask({children: pipe(filter(isVisibleMeta), vacate)})

const isIndexMeta = test({route: {isTabIndex: true}})
