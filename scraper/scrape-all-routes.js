let datasource = require('../core/datasource');
let database = require('../core/database');
let util = require('../core/util');

let scrapeRoute = require('./scrape-route');

function delayPromise(delay = 1) {
  return new Promise(resolve => {
    setTimeout(() => resolve(undefined), delay);
  });
}

function sequentializePromise(promisesFuncs, delay) {
  let resolved = [];
  return promisesFuncs
    .reduce((chain, promisesFuncs, i) => chain.then(promisesFuncs)
      .then(val => {
        console.log(i);
        return resolved.push(val);
      })
      .catch(() => undefined)
      .then(() => delayPromise(delay))
      .then(() => resolved)
    , Promise.resolve()
  );
}

let insertRoute = (info) => {
  let {route, bound, type} = info;
  let dbConnection = undefined;
  return database.connect()
    .then(db => dbConnection = db)
    .then(() => dbConnection.collection('route')
        .updateOne({route, bound, type}, {$set: info}, {upsert: true})
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
}

function main() {
  // const prefixList = ['B'];
  const prefixList = ['', 'A', 'B', 'C', 'R', 'E', 'NA'];
  const numList = Array.from({length: 3}, (v, i) => i).slice(1);
  // const numList = [49]
  const suffixList = ['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  // const suffixList = ['', ...'ABCDX'.split('')];

  let routeList = numList.map(num => prefixList.map(prefix => suffixList.map(suffix => prefix + num + suffix)));
  routeList = [].concat(...[].concat(...routeList));
  util.shuffle(routeList);
  // routeList = ['B1'];
  console.log(routeList);

  return sequentializePromise(
    routeList.map(route => () =>
      datasource.getBoundsInfo(route)
      .then(infos => infos.map(insertRoute)))
  )
    .then(bounds => bounds.reduce((acc, arr) => acc.concat(arr), []));
    // .then(bounds => bounds.reduce((promise, bound) => promise.then(() => scrapeRoute(bound.route, bound.bound, bound.type).catch(() => undefined).then(() => delayPromise())), Promise.resolve()));
}

module.exports = main;
