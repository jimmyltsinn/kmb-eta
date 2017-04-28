let DataSource = require('./core/datasource');
let Scraper = require('./scraper/scraper');
let Database = require('./core/database');

const route = '58M';
const bound = 2;
const seq = 0;

Database.setup()

// DataSource.getStops(route, bound)
// DataSource.getSchedule(route, bound)
// DataSource.getBoundsInfo(route)
// DataSource.getInfo(route, bound)
// DataSource.getAnnounce(route, bound)
// DataSource.getAllStops()
// DataSource.getETA(route, bound, seq)
// Scraper.scrapeAllStops()
  .then(obj => console.log(obj))
  .catch(console.error);
