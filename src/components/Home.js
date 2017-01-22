import React, { Component, PropTypes } from 'react'
import { asyncConnect } from 'redux-connect'
import { bindActionCreators } from 'redux'
import Header from './Home-Header'
import Helmet from 'react-helmet'

import { load } from 'redux/modules/auth'
import styles from './Home.scss'

@asyncConnect([],
  state => ({
    user: state.auth.data
  }),
  dispatch => bindActionCreators({
    load
  }, dispatch)
)
export default class Home extends Component {
  static propTypes = {
    children: PropTypes.element,
    params: PropTypes.object,
    load: PropTypes.func,
    user: PropTypes.object
  }

  componentDidMount () {
    if (__CLIENT__ && !this.props.user && window.localStorage.authToken) {
      this.props.load()
    }
  }

  render() {
    const {params} = this.props

    return (
      <div className={styles.home}>
        <Helmet title="Dashboard" />
        <Header params={params} />
        { this.props.children && React.cloneElement(this.props.children, {
          params
        })}
      </div>
    );
  }
}
