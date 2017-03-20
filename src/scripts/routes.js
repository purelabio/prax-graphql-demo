import {Router, Route, IndexRoute} from 'react-router'
import {journal} from './journal'
import createElement from './react-hack'

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
      <Route path='channels' component={Channels} />
      <Route path='*' component={Page404} />
    </Route>
  </Router>
)

/**
 * Debug
 */

window.app = {...window.app, routes: exports}
