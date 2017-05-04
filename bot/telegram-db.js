const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbname = process.env.MONGODB_DBNAME || 'kmb';

const collectionState = 'bot-telegram-state';
const collectionHistory = 'bot-telegram-history';

const defaultState = (chatid) => ({
  chatid,
  selection: {
    progress: 0
  },
  options: {
    bounds: {},
    stops: {}
  },
  lang: 'eng'
});

let connect = () => MongoClient.connect(url + '/' + dbname).catch(() => undefined);

let setupCollectionState = db => db.collection(collectionState)
  .createIndex({
    chatid: 1
  }, {
    unique: true
  });

let setupCollectionHistory = db => db.collection(collectionHistory)
.createIndex({
  chatid: 1,
  timestamp: 1
}, {
  unique: true
});

function setupCollections() {
  let db = undefined;
  return connect()
    .then(dbc => db = dbc)
    .then(() => setupCollectionState(db))
    .then(() => setupCollectionHistory(db))
    .then(() => db.close());
}

function insertHistory(chatid, data) {
  let db = undefined;
  let time = (new Date()).toISOString();
  return connect()
    .then(dbc => db = dbc)
    .then(() => db.collection(collectionHistory).insertOne({chatid, time, data}))
    .catch(err => console.error('Cannot write history??', err))
    .then(() => {
      if (db) db.close();
      return undefined;
    });
}

function saveState(chatid, state = defaultState(chatid)) {
  let db = undefined;
  return connect()
    .then(dbc => db = dbc)
    .then(() => db.collection(collectionState).updateOne({chatid}, {
      $set: state
    }, {
      upsert: true
    }))
    .catch(err => console.error('Cannot write state??', err))
    .then(() => {
      if (db) db.close();
      return undefined;
    });
}

function getState(chatid) {
  let db = undefined;
  let ret = defaultState(chatid);

  return connect()
    .then(dbc => db = dbc)
    .then(() => db.collection(collectionState)
      .findOne({chatid}, {_id: 0}))
    .then(state => {
      if (state)
        ret = state;
      return undefined;
    })
    .catch(err => console.log('Cannot find state and error?', err))
    .then(() => {
      if (db) db.close();
      return ret;
    });
}

module.exports = {
  insertHistory,
  getState,
  saveState,
  setupCollections, 
  defaultState
};
