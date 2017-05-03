const DBRef = require('mongodb').DBRef;

const datasource = require('../core/datasource');
const database = require('../core/database');
const test = require('assert');

let insertRoute = (route, bound, serviceType, info) => {
  let dbConnection = undefined;
  return database.connect()
    .then(db => dbConnection = db)
    .then(() => Promise.all(info.stops.map(stop => database.getStop(dbConnection, stop.bsiCode)
      .then(dbStop => {
        // test.deepEqual(dbStop.name, stop.name);
        // test.deepEqual(dbStop.address, stop.address);
        test.deepEqual(dbStop.location, stop.location);
        return {
          fare: stop.fare,
          seq: stop.seq,
          bsiCode: stop.bsiCode,
          stop: new DBRef('kmb', dbStop._id)
        };
      })
    )))
    .then(stops => info.stops = stops)
    .then(() => dbConnection.collection('route-detail')
        .updateOne({route, bound, serviceType}, {$set: info}, {upsert: true})
    )
    .then(() => {
      if (dbConnection) return dbConnection.close().then(() => info);
      return info;
    })
    .catch(err => {
      console.error('ERROR');
      console.error(err);
      if (dbConnection)
        return dbConnection.close().then(() => undefined);
      return undefined;
    });
};

let main = (route, bound, serviceType = 1) => {
  return datasource.getInfo(route, bound, serviceType, true)
    .then(info => insertRoute(route, bound, serviceType, info));
};

module.exports = main;
