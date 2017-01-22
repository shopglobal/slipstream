import React, { Component, PropTypes } from 'react';
import { asyncConnect } from 'redux-async-connect';
import Helmet from 'react-helmet'
import config from '../../config'

@asyncConnect([])
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    logout: PropTypes.func.isRequired,
    pushState: PropTypes.func.isRequired
  }

  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  render() {
    const styles = require('./App.scss');

    return (
      <div className={styles.app}>
        <Helmet {...config.app.head} />
        <div className={styles.appContent}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
