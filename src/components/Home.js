import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'
import Header from './Home-Header'

export default class Home extends Component {
  static propTypes = {
    children: PropTypes.element
  }

  render() {
    const styles = require('./Home.scss');
    return (
      <div className={styles.home}>
        <Helmet title="Slipstream - Content sharing platform" />
        <Header />
        { this.props.children }
      </div>
    );
  }
}
