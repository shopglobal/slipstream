import React, { Component, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { autobind } from 'core-decorators'

import { login } from 'redux/modules/auth'
import { TextField } from './common/Fields'
import { Button } from './common/Button'

@connect(
  () => ({}),
  dispatch => bindActionCreators({
    login
  }, dispatch)
)
@reduxForm({
  form: 'login'
})
export default class Login extends Component {
  static propTypes = {
    handleSubmit: PropTypes.func,
    login: PropTypes.func,
    hide: PropTypes.func
  }

  @autobind
  submitHandler (fields) {
    this.props.login(fields)
    .then(() => {
      this.props.hide()
    })
  }

  render () {
    const { handleSubmit } = this.props

    return (
      <form onSubmit={handleSubmit(this.submitHandler)}>
        <Field
          label="Username"
          name="username"
          type="text"
          component={TextField}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          component={TextField}
        />
        <Button
          primary
        >
          Login
        </Button>
      </form>
    )
  }
}
