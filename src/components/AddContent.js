import React, { Component, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form'

import { TextField, SelectField } from './common/Fields'
import { Button } from './common/Button'

import Address from './AddContent-Address'

@reduxForm({
  form: 'addContent'
})
export default class AddContent extends Component {
  static propTypes = {
    handleSubmit: PropTypes.func
  }

  render () {
    const {handleSubmit} = this.props

    return (
      <div>
        <h2>Add something</h2>
        <Address />
        <form onSubmit={handleSubmit}>
          <Field
            name="title"
            label="Title"
            component={TextField}
          />
          <Field
            name="stream"
            label="Type"
            options={[
              {value: 'share-this', label: 'Share this!'},
              {value: 'news', label: 'News'}
            ]}
            component={SelectField}
          />
          <Button primary>
            Submit
          </Button>
        </form>
      </div>
    )
  }
}
