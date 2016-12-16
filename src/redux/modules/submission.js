const GET_SUBMISSION = 'redux-example/auth/GET_SUBMISSION';
const GET_SUBMISSION_SUCCESS = 'redux-example/auth/GET_SUBMISSION_SUCCESS';
const GET_SUBMISSION_FAILURE = 'redux-example/auth/GET_SUBMISSION_FAILURE';

const initialState = {
  loaded: false
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_SUBMISSION:
      return {
        ...state,
        loading: true
      };
    case GET_SUBMISSION_SUCCESS:
      console.log('...action.result', action.result)
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
    default:
      return state;
  }
}

export function getContent(stream) {
  console.log('stream', stream);

  return {
    types: [GET_SUBMISSION, GET_SUBMISSION_SUCCESS, GET_SUBMISSION_FAILURE],
    promise: (client) => client.get(`/stream/${stream}/content`)
  };
}

