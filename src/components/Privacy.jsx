import React, {Component} from 'react'

export default class Privacy extends Component {
  render () {
    return (
      <div>
        <p>As of this writing, the BCNDP Connect app only collects your device ID if you approve it to upon launch, when it asks for permission to send push notifications.</p>
        <p>Beyond that, the basic Apple data collection privacy policy applies, where Apple may record your downloading of the app, and whatever error logging and usage data you explicitly allow Apple to collect throught their terms of use.</p>
        <p>The app may be updated to explicitly ask for your email, or link you to websites with different privacy policies. These sites may contain tracking and cookies.</p>
        <p>Our app may be updated to get completely anonymous usage info, such as number of shares, number of app openings, number of news stories viewed, or anonymized, general geo-location (city or political-riding level). This will be done with the most non-invasive tools possible, with the least risk of third-party data mining. <b>These terms of service will be updated if and when we begin to use such tools to enhance the app.</b></p>
      </div>
    )
  }
}
