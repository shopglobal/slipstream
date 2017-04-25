import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'

import 'react-select/dist/react-select.css'

import classes from './Fields.scss'

const commonProps = {
  input: PropTypes.object,
  label: PropTypes.string,
  type: PropTypes.string,
  id: PropTypes.string,
  meta: PropTypes.object,
  className: PropTypes.string
}

const TextField = ({ input, label, type, id, className, disabled, onBlur, meta: { touched, error } }) => {
  const hasError = (touched && error)

  const blurHandler = (event) => {
    input.onBlur(event)
    if (onBlur && !error) {
      onBlur(event)
    }
  }

  return (
    <div className={className || classes.textFieldContainer}>
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
        onBlur={blurHandler}
        disabled={disabled}
        type={type}
        id={id}
        className={!hasError ? classes.textField : classes.textFieldError}
      />
      { hasError &&
        <p className="invalidFieldText">{error}</p>
      }
    </div>
  )
}

const SelectField = ({ input, disabled, label, className, options, id, meta: { touched, error } }) => {
  const onChange = (event) => {
    input.onChange(event.value)
  }
  const hasError = (touched && error)

  return (
    <div className={className || classes.textFieldContainer}>
      <label htmlFor={id}>{label}</label>
      <Select
        id={id}
        options={options}
        disabled={disabled}
        {...input}
        onChange={onChange}
        onBlurResetsInput={false}
        onBlur={() => undefined}
        className={!hasError ? 'formField' : 'invalidFormField'}
      />
      { hasError &&
        <p className="invalidFieldText">{error}</p>
      }
    </div>
  )
}

const TextAreaField = ({ input, label, type, id, className, disabled, onBlur, meta: { touched, error } }) => {
  const hasError = (touched && error)

  const blurHandler = (event) => {
    input.onBlur(event)
    if (onBlur && !error) {
      onBlur(event)
    }
  }

  return (
    <div className={className || classes.textFieldContainer}>
      <label htmlFor={id}>{label}</label>
      <textarea
        {...input}
        onBlur={blurHandler}
        disabled={disabled}
        type={type}
        id={id}
        className={!hasError ? classes.textField : classes.textFieldError}
      />
      { hasError &&
        <p className="invalidFieldText">{error}</p>
      }
    </div>
  )
}

TextField.propTypes = commonProps
TextAreaField.propTypes = commonProps
SelectField.propTypes = { ...commonProps, options: PropTypes.array }

export { TextField, SelectField, TextAreaField }
