import React, { Component } from 'react'
import config from '../config'

import classes from './Dashboard-Home.scss'

export default class Home extends Component {
  render () {
    return (
      <div className={classes.home}>
        <h1 className={classes.title}>
          {config.app.title}
        </h1>
        <p className={classes.description}>
          {config.app.description}
        </p>
      </div>
    )
  }
}
