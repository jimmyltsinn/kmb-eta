import {createStore} from 'redux';
import rootReducer from './rootReducer';

const configureStore = () => {
  const store = createStore(
    rootReducer
  );
  return store;
};

export default configureStore;
