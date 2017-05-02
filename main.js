let datasource = require('./core/datasource');
let scrape = require('./scraper/scraper');
let database = require('./core/database');
let test = require('./core/test');

const route = 'N269';
const bound = 2;
const serviceType = 1;
const bsiCode = 'CA07-N-1400-0';
const seq = 7;

// database.setup()
// scrape.scrapeAllStops()
// scrape.scrapeRoute(route, bound)

// datasource.getInfo(route, bound, true)
//   .then(test.checkInfo)

// datasource.getStops(route, bound)
// datasource.getSchedule(route, bound)
// datasource.getBoundsInfo(route)
// datasource.getAnnounce(route, bound)
// datasource.getAllStops()
datasource.getETA(route, bound, serviceType, seq, bsiCode)
  .then(obj => console.log(obj))
  .catch(console.error);
