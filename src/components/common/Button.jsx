import React, { PropTypes } from 'react'

import classes from './Button.scss'

export function Button (props) {
  if (props.input) {
    return (
      <input
        type="button"
        onClick={props.onClick}
        className={!props.primary ? classes.button : classes.buttonPrimary}
        value={props.children}
      />
    )
  }

  return (
    <button
      type="submit"
      onClick={props.onClick}
      className={!props.primary ? classes.button : classes.buttonPrimary}
    >
      {props.children}
    </button>
  )
}

Button.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element
  ]),
  primary: PropTypes.bool,
  onClick: PropTypes.func,
  input: PropTypes.bool
}
