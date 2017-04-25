import React, {Component} from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { asyncConnect } from 'redux-connect'
import { Link } from 'react-router'
import { autobind } from 'core-decorators'
import Skylight from 'react-skylight'
import iosAdd from 'ionicons-svg/ios-add'
import SVGInline from 'react-svg-inline'

import { logout } from 'redux/modules/auth'
import AddContent from './AddContent'
import Login from './Login'

import classes from './Home-Header.scss'

@asyncConnect([],
  state => ({
    loaded: state.submission.loaded,
    user: state.auth.user
  }),
  dispatch => bindActionCreators({
    logout
  }, dispatch)
)
export default class Header extends Component {
  static propTypes = {
    loaded: PropTypes.bool,
    params: PropTypes.object,
    user: PropTypes.object,
    logout: PropTypes.func
  }

  @autobind
  logoutHandler () {
    this.props.logout()
  }

  render () {
    const { loaded, params } = this.props

    return (
      <div>
        <div className={classes.Header}>
          <Link to="/">Home</Link>
          <Link to="/stream/news">News</Link>
          <Link to="/stream/share-this">Share this!</Link>
          {this.props.user &&
            <div
              className={classes.authButton}
              onClick={this.logoutHandler}
            >
              Logout
            </div>
          }
          <div className={classes.addButtonContainer}>
            {this.props.user ?
              <SVGInline
                className={classes.addButton}
                height="30"
                width="30"
                svg={iosAdd}
                onClick={() => this.refs.addModal.show()}
              />
            :
              <div
                onClick={() => this.refs.loginModal.show()}
                className={classes.authButton}
              >
                Admin login
              </div>
            }
          </div>
        </div>
        <Skylight
          dialogStyles={{
            height: loaded ? '525px' : '300px',
            marginTop: loaded ? '-262px' : '-150px'
          }}
          hideOnOverlayClicked
          ref="addModal"
          title="Add something"
        >
          <AddContent
            hide={() => this.refs.addModal.hide()}
            params={params}
          />
        </Skylight>
        <Skylight
          hideOnOverlayClicked
          ref="loginModal"
          title="Login"
          dialogStyles={{
            height: '300px',
            marginTop: '-150px',
            marginLeft: '-250px',
            width: '500px'
          }}
        >
          <Login
            hide={() => this.refs.loginModal.hide()}
            params={params}
          />
        </Skylight>
      </div>
    )
  }
}
