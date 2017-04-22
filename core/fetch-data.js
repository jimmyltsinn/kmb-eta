const fetch = require('isomorphic-fetch');

const domain = 'http://search.kmb.hk/';
const lang = 0;

const infoKeys = [
  'Racecourse',
  'Airport',
  'Overnight',
  'Special',
  'BusType',

  'OriCName',
  'OriEName',
  // 'OriSCName',

  'DestCName',
  'DestEName',
  // 'DestSCName',

  'ServiceTypeTC',
  'ServiceTypeENG',
  // 'ServiceTypeSC',
];

const stopKeys = [
  'CName',          // Chinese Name
  // 'CLocation',   // Chinese Location
  'EName',          // English Name
  // 'ELocation',   // English Location
  // 'SCName',      // China name
  // 'SCLocation',  // China location
  // 'X',           // x-position in map
  // 'Y',           // y-position in map
  'AirFare',        // Fare for aircon bus
  // 'ServiceType', // ??
  'BSICode',        // bsi code of bus stop
  'Seq',            // Sequence number of stop
  // 'Direction',   // Direction ?
  // 'Bound',       // Bus bound (const)
  // 'Route'        // Bus route (const)
];

const etaKeys = [
  'w',              // Wheelchair
  'ex',             // ???
  // 'eot',            // ???
  't',              // ETA
  // 'ei',             // ???
  // 'bus_service_type', // ???
  // 'ol',             // ???
  'msg'             // Message
];

const scheduleDayType = ["W", "MF", "MS", "S", "H", "D", "X"];

function filterObjectByKeys(obj, keys) {
  return Object.keys(obj)
    .filter(key => keys.includes(key))
    .reduce((ret, k) => {
      ret[k] = obj[k];
      return ret;
    }, {});
}

function getInfo(route, bound) {
  route = route.toUpperCase();
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data.basicInfo)
    .then(info => filterObjectByKeys(info, infoKeys));
}

function getStops(route, bound) {
  route = route.toUpperCase();
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data)
    .then(obj => obj.routeStops.length > 0 ? obj.routeStops : undefined)
    .then(obj => obj.map(stop => filterObjectByKeys(stop, stopKeys)))
    .catch(console.error);
}

function getETA(route, bound, seq) {
  let bsiCode = 'dummy';
  let serviceType = 1;
  route = route.toUpperCase();

  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx/?action=geteta&lang=${lang}&route=${route}&bound=${bound}&seq=${seq}&servicetype=${serviceType}&bsiCode=${bsiCode}`)
    .then(res => res.json())
    .then(obj => obj.data)
    .then(obj => {
      obj.updated = (new Date(obj.updated)).toLocaleTimeString('en-US', {hour12: false});
      obj.generated = (new Date(obj.generated)).toLocaleTimeString('en-US', {hour12: false});
      obj.response = obj.response.map(eta => {
        let ret = filterObjectByKeys(eta, etaKeys);
        ret.ex = new Date(eta.ex).toLocaleTimeString('en-US', {hour12: false});
        return ret;
      });
      return obj;
    })
    .catch(() => undefined);
}

function getSchedule(route, bound) {
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getschedule&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data['01']);
}

module.exports = {
  getInfo,
  getStops,
  getETA,
  getSchedule
};
