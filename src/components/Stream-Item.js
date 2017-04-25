import React, {Component} from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import Share from './common/Share'
import ionLink from 'ionicons-svg/ios-browsers-outline'
import ionBook from 'ionicons-svg/ios-book'
import ionTrash from 'ionicons-svg/ios-trash'
import SVGInline from 'react-svg-inline'
import { autobind } from 'core-decorators'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { deleteContent } from 'redux/modules/content'

import classes from './Stream-Item.scss'

@connect(
  state => ({
    user: state.auth.user,
    userLoaded: state.auth.loaded
  }),
  dispatch => bindActionCreators({
    deleteContent
  }, dispatch)
)
export default class Item extends Component {
  static propTypes = {
    title: PropTypes.string,
    slug: PropTypes.string,
    format: PropTypes.string,
    isLatest: PropTypes.bool,
    images: PropTypes.array,
    dateAdded: PropTypes.string,
    url: PropTypes.string,
    deleteContent: PropTypes.func,
    user: PropTypes.object,
    userLoaded: PropTypes.bool
  }

  @autobind
  deleteHandler () {
    const confirm = window.confirm(`Press 'OK' to delete the entry "${this.props.title}". 'Cancel' to keep it.`)

    if (confirm) {
      this.props.deleteContent(this.props.slug)
    }
  }

  render () {
    const { isLatest, title, images, dateAdded, format, url } = this.props
    const isAdmin = this.props.userLoaded && this.props.user.role === 'ADMIN'

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
        <h3 className={classes.title}>
          { format === 'read' &&
            <SVGInline
              color="#8E8E8E"
              height="21"
              width="21"
              svg={ionBook}
              title="Readable content"
            />
          }
          {" "}<a href={url}>{`${title}`}</a>
          </h3>
        <Share url={this.props.url} />
        <div className={classes.meta}>
          <dic className={classes.actions}>
            <a
              href={this.props.url}
              target="_blank"
              title="Open in new tab"
              className={classes.linkoutContainer}
            >
              <SVGInline
                color="#8E8E8E"
                height="21"
                width="21"
                svg={ionLink}
              />
            </a>
            {isAdmin &&
              <div
                onClick={this.deleteHandler}
              >
                <SVGInline
                  color="#FF2F36"
                  height="21"
                  width="21"
                  svg={ionTrash}
                />
              </div>
            }
          </dic>
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
