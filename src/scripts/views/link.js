import {Link as RouterLink, IndexLink} from 'react-router'
import {seq, testOr} from 'prax'
import {preventDefault, readLocation, linkWithPersistence,
 linkToDict, strjoin} from '../utils'

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

  const link = linkWithPersistence(to, readLocation(read))

  props = {
    ...props,
    onClick: !disabled ? onClick : seq(preventDefault, onClick || _.noop),
    className: !disabled ? className : `no-pointer-styles ${className || ''}`,
  }

  return (
    isEmptyLink(link)
    ? <a {...props} />
    : isIndexLink(link)
    ? <IndexLink {...props} to={link} />
    : <RouterLink {...props} to={link} />
  )
}

const isEmptyLink = testOr(_.isNil, {pathname: _.isNil})

const isIndexLink = testOr('', '/', {pathname: ''}, {pathname: '/'})

export function RelativeLink ({to, ...props}, {read}) {
  const {pathname, query, hash} = linkToDict(to)
  const url = {pathname: strjoin('/', [read('route', 'pathname'), pathname]),  query, hash}
  return <Link to={url} {...props}/>
}