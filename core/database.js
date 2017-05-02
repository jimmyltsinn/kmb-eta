const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017/';
const dbname = 'kmb';

let connect = () => MongoClient.connect(url + dbname).catch(() => undefined);

let setupCollectionStops = db => {
  return db.collection('stops')
    .createIndex({
      bsiCode: 1
    }, {
      unique: true
    });
};

let setup = () => {
  let dbConnection = undefined;
  return connect()
    .then(db => {
      dbConnection = db;
    })
    .then(() => setupCollectionStops(dbConnection))
    .catch(console.err)
    .then(() => {
      if (dbConnection)
        return dbConnection.close();
      return undefined;
    });
};

let addStop = (db, stop) => db.collection('stops')
  .updateOne({bsiCode: stop.bsiCode}, {$set: stop}, {upsert: true});

let getStop = (db, bsiCode) => db.collection('stops').findOne({bsiCode});

module.exports = {
  connect,
  setup,
  addStop,
  getStop
};
