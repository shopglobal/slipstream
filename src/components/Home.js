import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'
import Header from './Home-Header'

import styles from './Home.scss'

export default class Home extends Component {
  static propTypes = {
    children: PropTypes.element,
    params: PropTypes.object
  }

  render() {
    const {params} = this.props

    return (
      <div className={styles.home}>
        <Helmet title="Slipstream - Content sharing platform" />
        <Header params={params} />
        { this.props.children && React.cloneElement(this.props.children, {
          params
        })}
      </div>
    );
  }
}
