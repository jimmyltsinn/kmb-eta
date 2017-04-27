const fetch = require('isomorphic-fetch');
const proj4 = require('proj4');

const util = require('./util');

const domain = require('../config').General.datasourceDomain;
const lang = 0;

const scheduleDayType = ["W", "MF", "MS", "S", "H", "D", "X"];

function xyToLatLng(loc) {
  const kmbProj = 'PROJCS["Hong_Kong_1980_Grid",GEOGCS["GCS_Hong_Kong_1980",DATUM["D_Hong_Kong_1980",SPHEROID["International_1924",6378388.0,297.0]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",836694.05],PARAMETER["False_Northing",819069.8],PARAMETER["Central_Meridian",114.1785555555556],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",22.31213333333334],UNIT["Meter",1.0],AUTHORITY["EPSG",2326]]';
  const googleProj = '+proj=longlat';

  let res =  proj4(kmbProj, googleProj, {
    x: loc.x,
    y: loc.y
  });
  return {
    lat: res.y - 0.001532178545,
    lng: res.x + 0.002514088216
  };
}

function parseInfo(info) {
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

  let ret = {
    origin: {
      eng: util.toCamelCase(info.OriEName),
      chi: info.OriCName
    },
    destination: {
      eng: util.toCamelCase(info.DestEName),
      chi: info.DestCName
    }
  };

  if (info.ServiceTypeENG && info.ServiceTypeENG !== '') {
    ret.serviceType = {
      eng: util.toCamelCase(info.ServiceTypeENG),
      chi: info.ServiceTypeTC
    };
  }

  return ret;
}

function parseStop(stop) {
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

  return {
    seq: parseInt(stop.Seq),
    name: {
      eng: util.toCamelCase(stop.EName),
      chi: stop.CName
    },
    location: {
      eng: util.toCamelCase(stop.ELocation),
      chi: stop.CLocation
    },
    fare: parseFloat(stop.AirFare),
    bsiCode: stop.BSICode,
    position: xyToLatLng({
      x: stop.X,
      y: stop.Y
    }),
  };
}

function parseETA(eta) {
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

  const time = eta.t.split('　');

  let ret = {
    wheelchair: eta.w && eta.w === 'Y',
    expire: new Date(eta.ex).toLocaleTimeString('en-US', {hour12: false}),
    time: time[0]
  };

  if (time.length > 1) {
    switch (time[1].trim().toLowerCase()) {
      case 'last bus':
        ret.flag = 'L';
        break;
      case 'scheduled':
        ret.scheduled = true;
        break;
      default:
        console.log(time[1]);
    }
  }

  return ret;
}

function parseAnnouncement(announcement) {
  let ret = {
    title: {
      eng: announcement.kpi_title,
      chi: announcement.kpi_title_chi
    },
    url: 'KMBWebSite/AnnouncementPicture.ashx?url=' + announcement.kpi_noticeimageurl,
    ref: announcement.kpi_referenceno
  };

  return ret;
}

function parseStopOfAll(stop) {
  return {
    name: {
      eng: stop.EName,
      chi: stop.CName
    },
    location: {
      eng: [stop.ELocation1, stop.ELocation2, stop.ELocation3].join(' ').trim(),
      chi: [stop.CLocation1, stop.CLocation2, stop.CLocation3].join('').trim()
    },
    position: xyToLatLng({
      x: stop.x,
      y: stop.y
    }),
    bsiCode: stop.BSICode
  };
}

function getAnnouncementDetail(announcement) {
  return fetch(domain + announcement.url)
    .then(res => res.text())
    .then(detail => util.getBody(detail))
    .then(detail => util.removeTags(detail))
    .then(detail => {
      announcement.detail = util.replaceNewLineCharacter(detail);
      delete announcement.url;
      return announcement;
    })
    .catch(() => announcement);
}

function getInfo(route, bound) {
  route = route.toUpperCase();
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data.basicInfo)
    .then(parseInfo)
    .then(obj => {
      obj.boundId = bound;
      return obj;
    });
}

function getStops(route, bound) {
  route = route.toUpperCase();
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getstops&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data)
    .then(obj => obj.routeStops.length > 0 ? obj.routeStops : undefined)
    .then(obj => obj.map(parseStop))
    .catch(console.error);
}

function getETA(route, bound, seq) {
  let bsiCode = 'dummy';
  let serviceType = 1;
  route = route.toUpperCase();
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx/?action=get_eta&lang=${lang}&route=${route}&bound=${bound}&seq=${seq}&servicetype=${serviceType}&bsiCode=${bsiCode}`)
    .then(res => res.json())
    .then(obj => obj.data)
    .then(obj => {
      obj.updated = (new Date(obj.updated)).toLocaleTimeString('en-US', {hour12: false});
      obj.generated = (new Date(obj.generated)).toLocaleTimeString('en-US', {hour12: false});

      if (obj.response.length == 1 && obj.response[0].t.trim() === 'The last bus has departed from this bus stop')
        obj.response = [];

      obj.response = obj.response.map(parseETA);

      return obj;
    })
    .catch(() => undefined);
}

function getSchedule(route, bound) {
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getschedule&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(obj => obj.data['01']);
}

function getAnnounce(route, bound) {
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getannounce&route=${route}&bound=${bound}`)
    .then(res => res.json())
    .then(json => json.data)
    .then(data => data.map(parseAnnouncement))
    .then(announcements => Promise.all(announcements.map(getAnnouncementDetail)));
}

function getAllStops() {
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getallstops`)
    .then(res => res.json())
    .then(json => json.data.stops)
    .then(data => data.map(parseStopOfAll));
}

function getBounds(route) {
  return fetch(domain + `KMBWebSite/Function/FunctionRequest.ashx?action=getroutebound&route=${route}`)
    .then(res => res.json())
    .then(json => json.data);
}

function getBoundsInfo(route) {
  return getBounds(route)
    .then(items => items.map(bound => bound.BOUND).filter((item, pos, self) => self.indexOf(item) == pos))
    .then(bounds => Promise.all(bounds.map(bound => getInfo(route, bound))));
}

module.exports = {
  getInfo,
  getStops,
  getETA,
  getSchedule,
  getAnnounce,
  getAllStops,
  getBounds,
  getBoundsInfo
};
