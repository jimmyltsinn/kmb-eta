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

let setup = db => {
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

let addStop = (db, stop) => {
  return db.collection('stops')
    .updateOne({bsiCode: stop.bsiCode}, {$set: stop}, {upsert: true});
};

module.exports = {
  connect,
  setup,
  addStop,
  // clearStops
};
