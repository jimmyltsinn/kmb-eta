import {combineReducers} from 'redux';

import {RESIZE_WINDOW} from '../actions/ui';

function window(state = {width: 0, height: 0}, action) {
  switch (action.type) {
    case RESIZE_WINDOW: return {width: action.width, height: action.height};
    default: return state;
  }
}

const ui = combineReducers({
  window
});

export default ui;
