const DELETE_CONTENT = 'redux-example/auth/DELETE_CONTENT';
const DELETE_CONTENT_SUCCESS = 'redux-example/auth/DELETE_CONTENT_SUCCESS';
const DELETE_CONTENT_FAILURE = 'redux-example/auth/DELETE_CONTENT_FAILURE';
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
        ...initialState,
        loading: true
      };
    case GET_CONTENT_SUCCESS:
      return {
        ...state,
        ...action.result,
        loading: false,
        loaded: true
      };
    case DELETE_CONTENT_SUCCESS:
      const newData = state.data.filter(item => item.slug !== action.result.data.slug)
      return {
        ...state,
        data: newData,
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
  return {
    types: [GET_CONTENT, GET_CONTENT_SUCCESS, GET_CONTENT_FAIL],
    promise: (client) => client.get(`/stream/${stream}/content`)
  };
}

export function deleteContent (slug) {
  return {
    types: [DELETE_CONTENT, DELETE_CONTENT_SUCCESS, DELETE_CONTENT_FAILURE],
    promise: (client) => client.del(`/content/${slug}`)
  }
}
