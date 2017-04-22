let getData = require('./core/fetch-data');

const route = '49X';
const bound = 1;
const seq = 0;

// getData.getStops(route, bound)
// getData.getSchedule(route, bound)
// getData.getInfo(route, bound)
getData.getETA(route, bound, seq)
  .then(console.log)
  .catch(console.error);
