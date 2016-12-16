import React, { Component } from 'react'
import { Link } from 'react-router'
import Skylight from 'react-skylight'
import iosAdd from 'ionicons-svg/ios-add'
import SVGInline from 'react-svg-inline'

import AddContent from './AddContent'

import classes from './Home-Header.scss'

export default class Header extends Component {
  render () {
    return (
      <div>
        <div className={classes.Header}>
          <Link to="/stream/read">Read stream</Link>
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
        <Skylight hideOnOverlayClicked ref="addModal">
          <AddContent />
        </Skylight>
      </div>
    )
  }
}
