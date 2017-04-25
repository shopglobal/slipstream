import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {asyncConnect} from 'redux-connect'
import scriptLoader from 'react-async-script-loader';

import {getSingle} from 'redux/modules/single'

const {IFRAMELY_API_KEY} = process.env

@asyncConnect([{
  promise: ({ store: { getState, dispatch }, params }) => {
    const {stream, embed} = params
    if (!getState().single.loaded) {
      return dispatch(getSingle({stream, content: embed }))
    }
  }
}],
  state => ({
    single: state.single.data
  })
)
@scriptLoader(`//cdn.iframe.ly/embed.js?api_key=${IFRAMELY_API_KEY}`)
export default class Embed extends Component {
  static propTypes = {
    single: PropTypes.string
  }

  render () {
    const {url} = this.props.single

    return (
      <div>
        <a href={url} data-iframely-url />
      </div>
    )
  }
}
