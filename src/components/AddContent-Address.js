import React, { Component, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form'
import validator from 'validator'

import { TextField } from './common/Fields'

@reduxForm({
  form: 'contentAddress'
})
export default class Address extends Component {
  static propTypes = {
    handleSubmit: PropTypes.func
  }

  addressValidator (value) {
    return !validator.isURL(value) ? 'Should be a valid web address.' : ''
  }

  urlChangeHandler (fields) {
    console.log(fields);
  }

  render () {
    const {handleSubmit} = this.props

    return (
      <form onSubmit={handleSubmit(::this.urlChangeHandler)}>
        <Field
          name="url"
          label="URL"
          validate={this.addressValidator}
          component={TextField}
        />
        <button hidden />
      </form>
    )
  }
}
