import {Router, Route, IndexRoute} from 'react-router'
import {journal} from './journal'

import {
  Root,
  Page404,
  Auth0SignIn,
  Channels
} from './views'

export const routes = (
  <Router history={journal} createElement={createElement}>
    <Route path='/' component={Root}>
      <IndexRoute component={Auth0SignIn} />

      <Route path='/channels' component={Channels}>
      </Route>

      <Route path='*' component={Page404} />
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
