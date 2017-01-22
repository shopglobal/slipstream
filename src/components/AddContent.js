import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { capitalize } from 'lodash'
import { autobind } from 'core-decorators'
import validator from 'validator'

import { postContent, deleteSubmission, updateSubmission } from 'redux/modules/submission'
import { getContent } from 'redux/modules/content'
import { TextField, SelectField, TextAreaField } from './common/Fields'
import { Button } from './common/Button'

import classes from './AddContent.scss'

const selector = formValueSelector('addContent')

@connect(state => ({
  stream: selector(state, 'stream'),
  format: selector(state, 'format'),
  initialValues: state.submission.data,
  loaded: state.submission.loaded
}), dispatch => bindActionCreators({
  postContent,
  deleteSubmission,
  updateSubmission,
  getContent
}, dispatch))
@reduxForm({
  form: 'addContent'
})
export default class AddContent extends Component {
  static propTypes = {
    handleSubmit: PropTypes.func,
    stream: PropTypes.string,
    format: PropTypes.string,
    loaded: PropTypes.bool,
    initialValues: PropTypes.object,
    postContent: PropTypes.func,
    deleteSubmission: PropTypes.func,
    updateSubmission: PropTypes.func,
    initialize: PropTypes.func,
    hide: PropTypes.func,
    params: PropTypes.object,
    getContent: PropTypes.func
  }

  static defaultProps = {
    initialValues: {}
  }

  addressValidator (value) {
    return !validator.isURL(value) ? 'Should be a valid web address.' : ''
  }

  @autobind
  submitHandler (fields) {
    this.props.postContent({
      ...fields
    })
  }

  @autobind
  resetFormHandler () {
    this.props.deleteSubmission(this.props.initialValues.slug)
    .then(() => {
      this.props.initialize({})
    })
  }

  @autobind
  publishHandler (fields) {
    const {slug} = this.props.initialValues

    this.props.updateSubmission(slug, {
      ...fields,
      flags: {
        hidden: false
      }
    })
    .then(() => {
      this.props.getContent(this.props.params.stream)
      this.props.hide()
    })
  }

  @autobind
  saveHandler (fields) {
    const {slug} = this.props.initialValues

    this.props.updateSubmission(slug, {
      ...fields
    })
    .then(() => {
      this.props.hide()
    })
  }

  render () {
    const {handleSubmit, stream, format, loaded} = this.props
    const {images} = this.props.initialValues

    return (
      <form
        className={classes.form}
        onSubmit={handleSubmit(!loaded ? this.submitHandler : this.publishHandler)}
      >
        <label htmlFor="formatContainer">Format</label>
        <div id="formatContainer" className={classes.formatContainer}>
          { ['read', 'watch', 'listen'].map((type, index) => (
              <label htmlFor={`format_${type}`}>
                <Field
                  id={`format_${type}`}
                  key={index}
                  type="radio"
                  name="format"
                  component="input"
                  value={type}
                />
              { ` ${capitalize(type)}` }
              </label>
            ))
          }
        </div>
        <Field
          name="stream"
          label="Stream"
          options={[
            {value: 'share-this', label: 'Share this!'},
            {value: 'news', label: 'News'}
          ]}
          value="news"
          component={SelectField}
          disabled={format ? false : true}
        />
        <Field
          name="url"
          disabled={stream ? false : true}
          label="URL"
          validate={this.addressValidator}
          component={TextField}
        />
        { this.props.loaded &&
          <div className={classes.previewContainer}>
            <Field
              disabled={!this.props.loaded}
              name="title"
              label="Title"
              component={TextField}
            />
            <div className={classes.bodyContainer}>
              <Field
                className={classes.descriptionContainer}
                component={TextAreaField}
                name="description"
                label="Description"
              />
              <div className={classes.imageContainer}>
                <label htmlFor="PreviewImage">Image</label>
                <img src={images ? images[0].thumb : ''} alt="Preview thumbnail" id="PreviewImage" />
              </div>
            </div>
          </div>
        }
        { loaded ?
          <div className={classes.actionsContainer}>
            <Button
              input
              onClick={this.resetFormHandler}
            >
              Reset form
            </Button>
            <Button
              input
              onClick={this.saveHandler}
            >
              Save as private
            </Button>
            <Button
              primary
              onClick={this.publishHandler}
            >
              Publish
            </Button>
          </div>
        :
          <div className={classes.actionsContainer}>
            <Button
              primary
            >
              Preview
            </Button>
          </div>
        }
      </form>
    )
  }
}
