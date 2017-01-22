const GET_SUBMISSION = 'redux-example/auth/GET_SUBMISSION';
const GET_SUBMISSION_SUCCESS = 'redux-example/auth/GET_SUBMISSION_SUCCESS';
const GET_SUBMISSION_FAILURE = 'redux-example/auth/GET_SUBMISSION_FAILURE';
const DELETE_SUBMISSION = 'submission/DELETE_SUBMISSION';
const DELETE_SUBMISSION_SUCCESS = 'submission/DELETE_SUBMISSION_SUCCESS';
const DELETE_SUBMISSION_FAILURE = 'submission/DELETE_SUBMISSION_FAILURE';
const UPDATE_SUBMISSION = 'submission/UPDATE_SUBMISSION';
const UPDATE_SUBMISSION_SUCCESS = 'submission/UPDATE_SUBMISSION_SUCCESS';
const UPDATE_SUBMISSION_FAILURE = 'submission/UPDATE_SUBMISSION_FAILURE';

const initialState = {
  loaded: false
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_SUBMISSION:
      return {
        ...initialState,
        loading: true
      };
    case GET_SUBMISSION_SUCCESS:
      return {
        ...state,
        ...action.result,
        loading: false,
        loaded: true
      };
    case GET_SUBMISSION_FAILURE:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: action.error
      };
    case DELETE_SUBMISSION_SUCCESS:
      return {
        ...initialState
      }
    case UPDATE_SUBMISSION_SUCCESS:
      return {
        ...initialState
      }
    default:
      return state;
  }
}

export function postContent({ url, stream, format }) {
  return {
    types: [GET_SUBMISSION, GET_SUBMISSION_SUCCESS, GET_SUBMISSION_FAILURE],
    promise: (client) => client.post(`/stream/${stream}/content`, {
      data: { url, format }
    })
  };
}

export function deleteSubmission (slug) {
  return {
    types: [DELETE_SUBMISSION, DELETE_SUBMISSION_SUCCESS, DELETE_SUBMISSION_FAILURE],
    promise: (client) => client.del(`/content/${slug}`)
  }
}

export function updateSubmission (slug, data) {
  return {
    types: [UPDATE_SUBMISSION, UPDATE_SUBMISSION_SUCCESS, UPDATE_SUBMISSION_FAILURE],
    promise: (client) => client.post(`/content/${slug}`, { data })
  }
}
