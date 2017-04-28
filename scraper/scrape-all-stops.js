let datasource = require('../core/datasource');
let database = require('../core/database');

let main = () => {
  let dbConnection = undefined;
  return database.connect()
    .then(db => {
      dbConnection = db;
      return datasource.getAllStops();
    })
    .then(stops => Promise.all(stops.map(stop => database.addStop(dbConnection, stop))))
    .then(() => dbConnection.close());
};

module.exports = main;
