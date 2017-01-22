import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { getContent } from 'redux/modules/content'
import { asyncConnect } from 'redux-connect'

import Item from './Stream-Item'
import classes from './Stream.scss'

@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    if (!getState().content.loaded) {
      return dispatch(getContent(params.stream))
    }
  }
}],
state => ({
  content: state.content.data
}),
dispatch => bindActionCreators({
  getContent
}, dispatch))
export default class Stream extends Component {
  static propTypes = {
    content: PropTypes.array,
    params: PropTypes.object,
    getContent: PropTypes.func
  }

  static defaultProps = {
    content: []
  }

  componentDidUpdate (oldProps) {
    const {stream} = this.props.params

    if (stream && oldProps.params.stream !== stream) {
      this.props.getContent(stream)
    }
  }

  render () {
    return (
      <div className={classes.streamContainer}>
        {this.props.content.map((content, index) => (
          <Item
            key={index}
            title={content.title}
            isLatest={(index === 0)}
            images={content.images}
            dateAdded={content.dateAdded}
            url={content.url}
          />
        ))}
      </div>
    )
  }
}
