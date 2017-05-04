let express = require('express');
// let cors = require('cors');

let database = require('../core/database.js');

let app = express();

let port = process.env.PORT || 3000;

// app.use(cors());

app.get('/routes', (req, res) => {
  let db = undefined;
  return database.connect()
    .then(dbc => db = dbc)
    .then(() => database.getAllRoutes(db))
    .then(data => {
      if (db) db.close();
      return data;
    })
    .then(data => res.json(data))
    .catch(console.error);
});

app.get('/route/:route', (req, res) => {
  let db = undefined;
  return database.connect()
    .then(dbc => db = dbc)
    .then(() => database.getRoutes(db, req.params.route.toUpperCase()))
    .then(data => {
      if (db) db.close();
      return data;
    })
    .then(data => res.json(data))
    .catch(console.error);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
