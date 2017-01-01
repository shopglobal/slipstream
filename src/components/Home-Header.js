import React, { Component, PropTypes } from 'react'
import { asyncConnect } from 'redux-connect'
import { Link } from 'react-router'
import Skylight from 'react-skylight'
import iosAdd from 'ionicons-svg/ios-add'
import SVGInline from 'react-svg-inline'

import AddContent from './AddContent'

import classes from './Home-Header.scss'

@asyncConnect([],
  state => ({
    loaded: state.submission.loaded
  })
)
export default class Header extends Component {
  static propTypes = {
    loaded: PropTypes.bool,
    params: PropTypes.object
  }

  render () {
    const { loaded, params } = this.props

    return (
      <div>
        <div className={classes.Header}>
          <Link to="/">Home</Link>
          <Link to="/stream/news">News</Link>
          <Link to="/stream/share-this">Share this!</Link>
          <div className={classes.addButtonContainer}>
            <SVGInline
              className={classes.addButton}
              height={30}
              width={30}
              svg={iosAdd}
              onClick={() => this.refs.addModal.show()}
            />
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
      </div>
    )
  }
}
