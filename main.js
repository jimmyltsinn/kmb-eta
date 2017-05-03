let datasource = require('./core/datasource');
let scraper = require('./scraper/scraper');
let database = require('./core/database');
let test = require('./core/test');

const route = '49X';
const bound = 2;
const serviceType = 1;
const bsiCode = 'CA07-N-1400-0';
const seq = 7;

// database.setup()
// scrape.scrapeAllStops()
// scrape.scrapeRoute(route, bound)

database.setup()
// scraper.scrapeAllStops()
// scraper.scrapeRoute(route, bound, serviceType)
// scraper.scrapeAllRoutes()

// datasource.getInfo(route, bound, serviceType, true)
//   .then(test.checkInfo)

// datasource.getStops(route, bound, serviceType)
// datasource.getSchedule(route, bound)
// datasource.getBoundsInfo(route)
// datasource.getAnnounce(route, bound)
// datasource.getAllStops()
// datasource.getETA(route, bound, serviceType, seq, bsiCode)
  .then(obj => console.log(obj))
  .catch(console.error);
