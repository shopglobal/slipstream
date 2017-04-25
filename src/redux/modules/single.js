const GET_ITEM = 'redux-example/auth/GET_ITEM';
const GET_ITEM_SUCCESS = 'redux-example/auth/GET_ITEM_SUCCESS';
const GET_ITEM_FAILURE = 'redux-example/auth/GET_ITEM_FAILURE';

const initialState = {
  data: {},
  loaded: false
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case GET_ITEM:
      return {
        ...initialState,
        loading: true
      };
    case GET_ITEM_SUCCESS:
      return {
        ...state,
        ...action.result,
        loading: false,
        loaded: true
      };
    case GET_ITEM_FAILURE:
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

export function getSingle({ content }) {
  return {
    types: [GET_ITEM, GET_ITEM_SUCCESS, GET_ITEM_FAILURE],
    promise: (client) => client.get(`/content/${content}`)
  };
}
