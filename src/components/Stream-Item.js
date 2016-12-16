import React, { Component, PropTypes } from 'react'

import classes from './Stream-Item.scss'

export default class Item extends Component {
  static propTypes = {
    title: PropTypes.string,
    isLatest: PropTypes.bool
  }

  render () {
    const { isLatest, title } = this.props

    return (
      <div className={classes.Item}>
        { isLatest &&
          <div className={classes.latestContainer}>
            <div className={classes.latest}>Latest</div>
          </div>
        }
        <h3 className={classes.title}>{title}</h3>
      </div>
    )
  }
}
