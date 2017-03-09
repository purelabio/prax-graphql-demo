import {val, scan} from 'prax'
import {Router, Route, IndexRoute, Redirect} from 'react-router'

import {maybeRouteMeta} from 'purelib'
import {journal} from './journal'

import {
  Root,
  Page404,
  SignUp, SignIn,
  Recover, RecoverDone,
} from './views'

export const routes = (
  <Router history={journal} createElement={createElement}>
    <Route path='/' component={Root} getMeta={val({title: 'Demo'})}>
      {/* Unused? */}
      <IndexRoute                             component={Passthrough} />

      <Route path='auth/sign-up'              component={SignUp} />
      <Route path='auth/sign-in'              component={SignIn} />
      <Route path='auth/recover'              component={Recover} />
      <Route path='auth/recover/done'         component={RecoverDone} />

      <Route path='*' component={Page404} />
    </Route>
  </Router>
)

function Passthrough ({children, route, ...props}, {read}) {
  if (scan(maybeRouteMeta({...props, route, read}), 'disabled')) return <Page404 />
  return children
}

// Dynamically reading `React.createElement` ensures the router uses the
// "hacked" version.
function createElement () {
  return React.createElement(...arguments)
}

/**
 * Debug
 */

window.app = {...window.app, routes: exports}
