let datasource = require('../core/datasource');
let database = require('../core/database');
let util = require('../core/util');

// let scrapeRoute = require('./scrape-route');

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
  let key = {route, bound, type};
  let dbConnection = undefined;
  return database.connect()
    .then(db => dbConnection = db)
    .then(() => dbConnection.collection('routes')
        .updateOne(key, {$set: info}, {upsert: true})
    )
    .then(() => {
      if (dbConnection) return dbConnection.close().then(() => info);
      return info;
    })
    .catch(err => {
      console.error('ERROR');
      console.error(err);
      if (dbConnection)
        return dbConnection.collection('error')
          .updateOne(route, {$set: {
            route,
            info,
            err
          }}, {upsert: true})
          .then(() => dbConnection.close());
      return undefined;
    });
};

function main() {
  // const prefixList = ['B'];
  const prefixList = ['', 'A', 'B', 'K', 'R', 'E', 'N', 'S', 'T', 'X', 'NA'];
  const numList = Array.from({length: 100}, (v, i) => i + 600).slice(0);
  // const numList = [49]
  const suffixList = ['', ...'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('')];
  // const suffixList = ['', ...'ABCDX'.split('')];

  let routeList = numList.map(num => prefixList.map(prefix => suffixList.map(suffix => prefix + num + suffix)));
  routeList = [].concat(...[].concat(...routeList));
  util.shuffle(routeList);
  // routeList = ['107']
  // routeList = ['B1'];
  console.log(routeList);

  return sequentializePromise(
    routeList.map(route => () => {
      return datasource.getBoundsInfo(route)
      .then(infos => sequentializePromise(infos.map(info => () => insertRoute(info))));
    }
  ))
    .then(bounds => bounds.reduce((acc, arr) => acc.concat(arr), []));
    // .then(bounds => bounds.reduce((promise, bound) => promise.then(() => scrapeRoute(bound.route, bound.bound, bound.type).catch(() => undefined).then(() => delayPromise())), Promise.resolve()));
}

module.exports = main;
