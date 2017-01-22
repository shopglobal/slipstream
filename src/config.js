require('babel-polyfill');

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development'];

const description = process.env.SITE_DESCRIPTION || "Content sharing tool."
const title = process.env.SITE_NAME || "Slipstream"

module.exports = Object.assign({
  host: process.env.HOST || 'localhost',
  port: process.env.PORT,
  apiHost: process.env.API_HOST || `http://localhost:${process.env.APIPORT}`,
  apiPort: process.env.NODE_ENV === 'production' ? process.env.PORT : process.env.APIPORT,
  app: {
    title: title,
    description: description,
    head: {
      titleTemplate: `${title} - %s`,
      meta: [
        {name: 'description', content: description},
        {charset: 'utf-8'},
        {property: 'og:site_name', content: title},
        {property: 'og:title', content: title},
        {property: 'og:description', content: description},
        {property: 'og:card', content: 'summary'},
        {property: 'og:image', content: 'https://react-redux.herokuapp.com/logo.jpg'},
        {property: 'og:image:width', content: '200'},
        {property: 'og:image:height', content: '200'}
      ]
    }
  },

}, environment);
