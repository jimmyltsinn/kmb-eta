const datasource = require('../core/datasource');
const database = require('../core/database');
const test = require('assert');

let checkInfo = info => {
  let dbConnection = undefined;
  return database.connect()
    .then(db => dbConnection = db)
    .then(() => {
      return info.stops.map(stop => {
        database.getStop(dbConnection, stop.bsiCode)
          .then(dbStop => {
            // test.deepEqual(dbStop.name, stop.name);
            // test.deepEqual(dbStop.address, stop.address);
            test.deepEqual(dbStop.location, stop.location);
          });
      });
    })
    .then(() => {
      if (dbConnection) return dbConnection.close().then(() => info);
      return info;
    })
    .catch(err => {
      console.error(err);
      if (dbConnection)
        return dbConnection.close().then(() => undefined);
      return undefined;
    });
};

let main = (route, bound) => {
  return datasource.getInfo(route, bound, true)
    .then(checkInfo);
};

module.exports = main;
