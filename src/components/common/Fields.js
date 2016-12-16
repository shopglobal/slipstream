import React, { PropTypes } from 'react'
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

const TextField = ({ input, label, type, id, className, meta: { touched, error } }) => {
  const hasError = (touched && error)

  return (
    <div className={className || classes.textFieldContainer}>
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
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

const SelectField = ({ input, label, className, options, id, meta: { touched, error } }) => {
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

TextField.propTypes = commonProps
SelectField.propTypes = { ...commonProps, options: PropTypes.array }

export { TextField, SelectField }
