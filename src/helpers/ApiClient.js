import superagent from 'superagent';
import config from '../config';

const { NODE_ENV } = process.env;

const methods = ['get', 'post', 'put', 'patch', 'del'];

function formatUrl(path) {
  const adjustedPath = path[0] !== '/' ? '/' + path : path;
  if (__SERVER__ || NODE_ENV === 'production') {
    return `${config.apiHost}/v1${adjustedPath}`
  }

  return '/api' + adjustedPath;
}

export default class ApiClient {
  constructor() {
    methods.forEach((method) =>
      this[method] = (path, { params, data } = {}) => new Promise((resolve, reject) => {
        const request = superagent[method](formatUrl(path));

        if (params) {
          request.query(params);
        }

        // if (__SERVER__ && req.get('cookie')) {
        //   request.set('cookie', req.get('cookie'));
        // }

        if (data) {
          request.send(data);
        }

        if (__CLIENT__ && window.localStorage.authToken) {
          request.set('authorization', window.localStorage.authToken)
        }

        request.end((err, { body } = {}) => err ? reject(body || err) : resolve(body));
      }));
  }
  /*
   * There's a V8 bug where, when using Babel, exporting classes with only
   * constructors sometimes fails. Until it's patched, this is a solution to
   * "ApiClient is not defined" from issue #14.
   * https://github.com/erikras/react-redux-universal-hot-example/issues/14
   *
   * Relevant Babel bug (but they claim it's V8): https://phabricator.babeljs.io/T2455
   *
   * Remove it at your own risk.
   */
  empty() {}
}
