import {Link as RouterLink, IndexLink} from 'react-router'
import {seq, testOr} from 'prax'
import {strJoin} from 'purelib'
import {preventDefault, linkToDict} from '../utils'

// TODO roll our own "active route" detection. To define the active class,
// accept a function from bool to string instead of just a string.
export function Link (
  {to, trackActive, activeClassName, disabled, onClick, className, ...props},
  {read}
) {
  if (trackActive) {
    // Track route change and set active class. Disabled by default due to the
    // performance cost in the `react-router` link implementation.
    read('route')
    props = {activeClassName: activeClassName || 'active', ...props}
  }

  props = {
    ...props,
    onClick: !disabled ? onClick : seq(preventDefault, onClick || _.noop),
    className: !disabled ? className : `no-pointer-styles ${className || ''}`,
  }

  return (
    isEmptyLink(to)
    ? <a {...props} />
    : isIndexLink(to)
    ? <IndexLink {...props} to={to} />
    : <RouterLink {...props} to={to} />
  )
}

const isEmptyLink = testOr(_.isNil, {pathname: _.isNil})

const isIndexLink = testOr('', '/', {pathname: ''}, {pathname: '/'})

export function RelativeLink ({to, ...props}, {read}) {
  const {pathname, query, hash} = linkToDict(to)
  const url = {pathname: strJoin('/', [read('route', 'pathname'), pathname]),  query, hash}
  return <Link to={url} {...props}/>
}
