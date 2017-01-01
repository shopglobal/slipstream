import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import {reducer as reduxAsyncConnect} from 'redux-async-connect';

import auth from './auth';
import content from './content';
import submission from './submission';
import {reducer as form} from 'redux-form';

export default combineReducers({
  routing: routerReducer,
  reduxAsyncConnect,
  submission,
  auth,
  content,
  form
});
