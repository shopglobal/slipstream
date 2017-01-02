import React, { Component, PropTypes } from 'react'
import moment from 'moment'
import Share from './common/Share'
import ionLink from 'ionicons-svg/ios-browsers-outline'
import SVGInline from 'react-svg-inline'

import classes from './Stream-Item.scss'

export default class Item extends Component {
  static propTypes = {
    title: PropTypes.string,
    isLatest: PropTypes.bool,
    images: PropTypes.array,
    dateAdded: PropTypes.string,
    url: PropTypes.string
  }

  render () {
    const { isLatest, title, images, dateAdded } = this.props

    return (
      <div className={classes.Item}>
        { isLatest &&
          <div className={classes.latestContainer}>
            <div className={classes.latest}>Latest</div>
          </div>
        }
        { (images && images[0]) &&
          <img
            src={images[0].thumb}
            title="Story thumbnail"
            style={{
              height: 'auto',
              width: '100%'
            }}
          />
        }
        <h3 className={classes.title}>{title}</h3>
        <Share url={this.props.url} />
        <div className={classes.meta}>
          <a
            href={this.props.url}
            target="_blank"
            title="Open in new tab"
            className={classes.linkoutContainer}
          >
            <SVGInline
              color="#8E8E8E"
              height={21}
              width={21}
              svg={ionLink}
              onClick={() => this.refs.addModal.show()}
            />
          </a>
          <span
            className={classes.timeAgo}
            title={moment(dateAdded).format('MMMM D YYYY, HH:mm')}
          >
            {moment(dateAdded).fromNow()}
          </span>
        </div>
      </div>
    )
  }
}
