import React from 'react'
import {Route} from 'react-router'
// import { isLoaded as isAuthLoaded, load as loadAuth } from 'redux/modules/auth';
import { App } from 'containers'
import Home from './components/Home'
import Stream from './components/Stream'
import Privacy from './components/Privacy'
import Embed from './components/Embed'

export default () => { // passing in 'store'
//   const requireLogin = (nextState, replace, cb) => {
//     function checkAuth() {
//       const { auth: { user }} = store.getState();
//       if (!user) {
//         // oops, not logged in, so can't be here!
//         replace('/');
//       }
//       cb();
//     }

//     if (!isAuthLoaded(store.getState())) {
//       store.dispatch(loadAuth()).then(checkAuth);
//     } else {
//       checkAuth();
//     }
//   };

  return (
    <Route>
      <Route component={App}>
        <Route path="/" component={Home}>
          <Route path="/stream/:stream" component={Stream} />
          <Route path="/privacy" component={Privacy} />
        </Route>
      </Route>
      <Route path="/embed/:embed" component={Embed} />
    </Route>
  )
}
