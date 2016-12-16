import React, { Component, PropTypes } from 'react'
import { getContent } from 'redux/modules/content'
import { asyncConnect } from 'redux-connect'

import Item from './Stream-Item'

@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    if (!getState().content.loaded) {
      return dispatch(getContent(params.stream))
    }
  }
}],
state => ({
  content: state.content.data
}))
export default class Stream extends Component {
  static propTypes = {
    content: PropTypes.array
  }

  static defaultProps = {
    content: []
  }

  render () {
    return (
      <div>
        {this.props.content.map((content, index) => (
          <Item
            key={index}
            title={content.title}
            isLatest={(index === 0)}
          />
        ))}
      </div>
    )
  }
}
