let datasource = require('./core/datasource');
let scraper = require('./scraper/scraper');
let database = require('./core/database');
let test = require('./core/test');

const route = '49X';
const bound = 1;
const serviceType = 1;
const seq = 0;

// database.setup()
// scraper.scrapeAllStops()
// scraper.scrapeRoute(route, bound, serviceType)
scraper.scrapeAllRoutes()

// datasource.getInfo(route, bound, serviceType, true)
//   .then(test.checkInfo)

// datasource.getStops(route, bound)
// datasource.getSchedule(route, bound)
// datasource.getBoundsInfo(route)
// datasource.getAnnounce(route, bound)
// datasource.getAllStops()
// datasource.getETA(route, bound, seq)
  .then(obj => console.log(obj))
  .catch(console.error);
