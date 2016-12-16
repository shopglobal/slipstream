const GET_CONTENT = 'redux-example/auth/GET_CONTENT';
const GET_CONTENT_SUCCESS = 'redux-example/auth/GET_CONTENT_SUCCESS';
const GET_CONTENT_FAIL = 'redux-example/auth/GET_CONTENT_FAIL';

const initialState = {
  loaded: false
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_CONTENT:
      return {
        ...state,
        loading: true
      };
    case GET_CONTENT_SUCCESS:
      console.log('...action.result', action.result)
      return {
        ...state,
        ...action.result,
        loading: false,
        loaded: true
      };
    case GET_CONTENT_FAIL:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: action.error
      };
    default:
      return state;
  }
}

export function getContent(stream) {
  console.log('stream', stream);

  return {
    types: [GET_CONTENT, GET_CONTENT_SUCCESS, GET_CONTENT_FAIL],
    promise: (client) => client.get(`/stream/${stream}/content`)
  };
}

