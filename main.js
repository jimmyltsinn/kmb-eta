let getData = require('./core/fetch-data');

const route = '58M';
const bound = 2;
const seq = 0;

getData.getStops(route, bound)
// getData.getSchedule(route, bound)
// getData.getBoundsInfo(route)
// getData.getInfo(route, bound)
// getData.getAnnounce(route, bound)
// getData.getAllStops()
// getData.getETA(route, bound, seq)
  .then(obj => console.log(JSON.stringify(obj)))
  .catch(console.error);
