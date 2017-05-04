const MongoClient = require('mongodb').MongoClient;

const url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbname = process.env.MONGODB_DBNAME || 'kmb';

let connect = () => {
  console.log(url);
  return MongoClient.connect(url + '/' + dbname).catch(() => undefined);
};

let setupCollectionStops = db => db.collection('stops')
  .createIndex({
    bsiCode: 1
  }, {
    unique: true
  });

let setupCollectionRoutes = db => db.collection('routes')
  .createIndex({
    route: 1,
    bound: 1,
    type: 1
  }, {
    unique: true
  });

let setup = () => {
  let dbConnection = undefined;
  return connect()
    .then(db => {
      dbConnection = db;
    })
    .then(() => setupCollectionStops(dbConnection))
    .then(() => setupCollectionRoutes(dbConnection))
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

let getAllRoutes = db => db.collection('routes').find({}, {route: 1, bound: 1, type: 1, origin: 1, destination: 1, typeDetail: 1, _id: 0}).toArray();
let getRoutes = (db, route) => db.collection('routes').find({route}, {_id: 0}).toArray();

module.exports = {
  connect,
  setup,
  addStop,
  getStop,
  getAllRoutes,
  getRoutes
};
