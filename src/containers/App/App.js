import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { asyncConnect } from 'redux-async-connect';

@asyncConnect([])
export default class App extends Component {
  static propTypes = {
    children: PropTypes.object.isRequired,
    user: PropTypes.object,
    logout: PropTypes.func.isRequired
  }

  static contextTypes = {
    store: PropTypes.object.isRequired
  }

  render() {
    const styles = require('./App.scss');

    return (
      <div className={styles.app}>
        <div className={styles.appContent}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
