import React, { PropTypes } from 'react'

import classes from './Button.scss'

export function Button (props) {
  return (
    <button
      className={!props.primary ? classes.button : classes.buttonPrimary}
    >
      {props.children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.element,
  primary: PropTypes.bool
}
