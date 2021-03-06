let datasource = require('./core/datasource');
let scraper = require('./scraper/scraper');
let database = require('./core/database');
let test = require('./core/test');

const route = '49X';
const bound = 2;
const serviceType = 1;
const bsiCode = 'CA07-S-5100-0';
const seq = 7;

let db = undefined;
database.connect()
  .then(dbConnection => db = dbConnection)
  .then(() => database.getAllRoutes(db))
  .then(arr => {
    if (db) db.close();
    return arr;
  })

// database.setup()
// scrape.scrapeAllStops()
// scrape.scrapeRoute(route, bound)

// database.setup()
// scraper.scrapeAllStops()
// scraper.scrapeRoute(route, bound, serviceType)
// scraper.scrapeAllRoutes()

/// datasource.getInfo(route, bound, serviceType, true)
//   .then(test.checkInfo)

// datasource.getStops(route, bound, serviceType)
// datasource.getSchedule(route, bound)
// datasource.getBoundsInfo(route)
// datasource.getAnnounce(route, bound)
// datasource.getAllStops()
// datasource.getETA(route, bound, serviceType, seq, bsiCode)



  .then(obj => console.log(obj))
  .catch(console.error);
