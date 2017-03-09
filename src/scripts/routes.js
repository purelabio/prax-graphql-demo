import {Router, Route, IndexRoute} from 'react-router'
import {val} from 'prax'
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
      <IndexRoute                             component={SignIn} />
      <Route path='auth/sign-up'              component={SignUp} />
      <Route path='auth/sign-in'              component={SignIn} />
      <Route path='auth/recover'              component={Recover} />
      <Route path='auth/recover/done'         component={RecoverDone} />
      <Route path='*'                         component={Page404} />
    </Route>
  </Router>
)

// Dynamically reading `React.createElement` ensures the router uses the
// "hacked" version.
function createElement () {
  return React.createElement(...arguments)
}

/**
 * Debug
 */

window.app = {...window.app, routes: exports}
