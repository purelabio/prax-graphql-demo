import {split, replace} from 'lodash/fp'
import {PraxComponent} from 'prax'
import {Link as RouterLink, IndexLink} from 'react-router'
import {seq, testBy, ifelse, id, pipe, testOr} from 'prax'
import {preventDefault, linkToDict, strJoin, getf} from '../utils'

export class Link extends PraxComponent {
  subrender ({read}) {
    const {
      env: {store},
      props: {to, getActiveClassName, disabled, onClick, className, ...rest},
    } = this
    let props = rest

    const activeClassName = (
      _.isFunction(getActiveClassName)
      ? getActiveClassName(testBy(
        toPath(linkPathname(to)),
        // Index path looks like this: ['']
        // Non-index path (say, 'about') looks like this: ['', 'about']
        read(store, ['nav', 'location', 'path'])
      ))
      : ''
    )

    props = {
      ...props,
      onClick: !disabled ? onClick : seq(preventDefault, onClick || _.noop),
      className: strJoin(' ', [
        disabled && 'no-pointer-styles',
        activeClassName,
        className,
      ]),
    }

    return (
      isEmptyLink(to)
      ? <a {...props} />
      : isIndexLink(to)
      ? <IndexLink {...props} to={to} />
      : <RouterLink {...props} to={to} />
    )
  }
}

const isEmptyLink = testOr(_.isNil, {pathname: _.isNil})

const isIndexLink = testOr('', '/', {pathname: ''}, {pathname: '/'})

const linkPathname = ifelse(_.isString, id, getf('pathname'))

// Prepend /
// 'blah' -> '/blah' -> ['', 'blah']
const toPath = pipe(replace(/^([^/])/, '/$1'), split('/'))

export class RelativeLink extends PraxComponent {
  subrender ({read}) {
    const {env: {store}, props: {to, ...props}} = this
    const {pathname, query, hash} = linkToDict(to)
    const location = {
      pathname: strJoin('/', [read(store, ['nav', 'location', 'pathname']), pathname]),
      query,
      hash,
    }
    return <Link {...props} to={location} />
  }
}
