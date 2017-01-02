import React, { Component, PropTypes } from 'react'
import {
  ShareButtons,
  generateShareIcon,
  ShareCounts
} from 'react-share'

import classes from './Share.scss'

const FacebookIcon = generateShareIcon('facebook')
const TwitterIcon = generateShareIcon('twitter')

const {
  FacebookShareButton,
  TwitterShareButton
} = ShareButtons

const {
  FacebookShareCount
} = ShareCounts

const shares = [
  { Container: FacebookShareButton, Count: FacebookShareCount, Icon: FacebookIcon },
  { Container: TwitterShareButton, Count: null, Icon: TwitterIcon }
]

export default class Shares extends Component {
  static propTypes = {
    url: PropTypes.string
  }

  render () {
    return (
      <div className={classes.sharesContainer}>
        { shares.map((Share, index) => (
          <Share.Container className={classes.share} url={this.props.url} key={index}>
            <Share.Icon size={32} round />
            { Share.Count &&
              <Share.Count url={this.props.url}>
                {count => <span>{count}</span>}
              </Share.Count>
            }
          </Share.Container>
        ))}
      </div>
    )
  }
}
