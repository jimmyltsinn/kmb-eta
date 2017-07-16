const TelegramBot = require('node-telegram-bot-api');
const geolib = require('geolib');

const config = require('../config').Telegram;
const DataSource = require('../core/datasource');
const database = require('./telegram-db');
const util = require('../core/util');

const bot = new TelegramBot(config.token, {polling: true});

// const record = {};
// const state = {};

const lang = 'chi';

const command = {
  reset: {
    text: '/reset',
    regex: /\/reset ?(\d+)?/
  },
  refresh: {
    text: '/refresh',
    regex: /\/refresh/
  },
  lastLocation: {
    text: 'Use my last location'
  }
};

// let recordHistory = (handleName, msg, res = '') => {
//   let ret = {
//     time: new Date().getTime(),
//     handle: handleName,
//     message: msg,
//     response: res
//   };
//
//   if (!record[msg.chat.id]) record[msg.chat.id] = [];
//   record[msg.chat.id] = [
//     ...record[msg.chat.id],
//     ret
//   ];
//
//   return ret;
// };

// let initState = chatid => ({
//   chatid: chatid,
//   progress: 0
// });

let myid = msg => `Your chat id is ${msg.chat.id}`;

// let history = msg => history[msg.chat.id] ? history[msg.chat.id].map(JSON.stringify) : 'EMPTY';
let getState = id => database.getState(id);
let setState = (id, state) => {
  return database.saveState(id, state)
    .then(() => state);
};

let reset = (msg, match) => {
  let id = msg.chat.id;
  if (match[1] !== undefined) id = match[1];
  if (id != msg.chat.id && msg.chat.id != config.adminChatId)
    id = msg.chat.id;

  let myState;

  return database.getState(id)
    .then(state => {
      state.selection = database.defaultState(id).selection;
      myState = state;
      return state;
    })
    .then(state => database.saveState(id, state))
    .then(() => myState)
    .then(state => bot.sendMessage(msg.chat.id, 'The state has been reset', {
      reply_markup: JSON.stringify({
        keyboard: state.history === undefined ? [['You have not history yet. ']] : util.arrayToGrid(state.history, 3),
        resize_keyboard: true,
      })}));
};

let myState = (msg, match) => {
  let id = msg.chat.id;
  if (match.length > 2) id = match[1];
  if (id != msg.chat.id && msg.chat.id != config.adminChatId)
    id = msg.chat.id;

  return getState(id)
    .then(state => {
      delete state.options;
      return JSON.stringify(state);
    });
};

let refresh = (msg) => {
  return database.getState(msg.chat.id)
    .then(state => reply(state));
};

let start = msg => {
  // if (!getState(msg.chat.id)) state[msg.chat.id] = initState(msg.chat.id);
  return 'Welcome. You can now start using this bot. ';
};

// ---------------------------------------------

let askForRoute = state => {
  return 'Please enter the route. ';
};

let parseRoute = (state, input) =>
  new Promise((resolve, reject) => {
    if (input.search(/^[A-Za-z0-9]+$/) < 0)
      reject('This is not a valid route number');
    resolve(input);
  })
  .then(route => DataSource.getBoundsInfo(route, false))
  .then(bounds => new Promise((resolve, reject) => {
    if (bounds.length == 0) reject('Route not found');

    state.selection.route = input.toUpperCase();
    state.options.bounds.text = '';
    state.options.bounds.list = bounds.map(bound => {
      let ret = {
        bound: bound.bound,
        type: bound.type,
        text: `(${bound.bound}.${bound.type})`,
      };

      if (bound.airport) {
        ret.text += '✈️';
      } else if (bound.racecourse) {
        ret.text += '🐎';
      } else if (bound.overnight) {
        ret.text += '🌙';
      } else if (bound.typeDetail) {
        ret.text += '❗️';
      } else {
        ret.text += ' ';
      }
      ret.text += `${bound.origin[lang]}➡️${bound.destination[lang]}`;

      state.options.bounds.text += ret.text;
      if (bound.typeDetail && bound.typeDetail[lang] && bound.typeDetail[lang] !== '') state.options.bounds.text += ` (${bound.typeDetail[lang]})`;
      state.options.bounds.text += '\n';

      return ret;
    });

    if (state.history === undefined)
      state.history = [];
    state.history = [state.selection.route].concat(state.history.filter(route => route != state.selection.route));

    resolve(state);
  }));

let askForBound = state => {
  const keyboard = [
    ...state.options.bounds.list.filter(bound => bound.type == 1).map(bound => [bound.text]),
    ...util.arrayToGrid(state.options.bounds.list.filter(bound => bound.type != 1).map(bound => bound.text), 3),
    ...[[command.reset.text]]
  ];
  const reply_markup = JSON.stringify({
    keyboard,
    // one_time_keyboard: true,
    resize_keyboard: true
  });

  return bot.sendMessage(state.chatid, 'Please select the direction. \n' + state.options.bounds.text, {reply_markup});
};

let parseBound = (state, input) => {
  let selectedBound = undefined;
  return new Promise((resolve, reject) => {
    if (!isNaN(parseInt(input))) return parseInt(input);

    for (let i = 0; i < state.options.bounds.list.length; ++i) {
      if (input === state.options.bounds.list[i].text)
        resolve(state.options.bounds.list[i]);
    }

    reject('Unknown bound inputted');
  })
  .then(obj => {
    selectedBound = obj;
    return DataSource.getStops(state.selection.route, obj.bound, obj.type);
  })
  .then(stops => new Promise((resolve, reject) => {
    if (stops.length == 0) {
      reject('Unknown bound selected');
    }

    state.selection.bound = selectedBound.bound;
    state.selection.type = selectedBound.type;

    state.options.stops.list = stops.map(stop => ({
      seq: stop.seq,
      text: `[${stop.seq}] ${stop.name[lang]}`,
      location: stop.location,
      bsiCode: stop.bsiCode
    }));

    resolve(state);
  }));
};

let askForStop = state => {
  let keyboardPreset = [[], []];

  keyboardPreset[0].push({
    text: 'Find stop by my location',
    request_location: true
  });

  if (state.location !== undefined) {
    keyboardPreset[1].push({
      text: command.lastLocation.text,
      // request_location: true
    });
  }

  return bot.sendMessage(state.chatid, 'Please select the stop', {
    reply_markup: JSON.stringify({
      keyboard: [
        ...keyboardPreset.filter(row => row.length > 0),
        ...util.arrayToGrid(state.options.stops.list, 3),
        ...[[command.reset.text]]
      ],
      // one_time_keyboard: true,
      resize_keyboard: true,
      force_reply: false
    })
  });
};

let parseStop = (state, input) =>
  new Promise((resolve, reject) => {
    let stop = undefined;

    if (!isNaN(parseInt(input))) return parseInt(input);
    if (input === command.lastLocation.text)
      return resolve(parseStopByLocation(state));
    for (let i = 0; i < state.options.stops.list.length; ++i)
      if (input === state.options.stops.list[i].text)
        stop = state.options.stops.list[i];

    if (stop === undefined)
      reject('Unknown stop inputted');

    state.selection.seq = stop.seq;
    state.selection.bsiCode = stop.bsiCode;
    delete state.selection.dist;
    resolve(state);
  });

let getNearestStop = state => {
  state.options.stops.list = state.options.stops.list.map(stop => Object.assign(stop, {dist: geolib.getDistance(state.location, stop.location)}));
  return state.options.stops.list.reduce((min, stop) => min.dist <= stop.dist ? min : stop, {dist: 1e99});
};

let parseStopByLocation = state => {
  let nearestData = getNearestStop(state);
  state.selection.seq = nearestData.seq;
  state.selection.bsiCode = nearestData.bsiCode;
  state.selection.dist = nearestData.dist;
  return state;
};


let replyETA = state => {
  return DataSource.getETA(state.selection.route, state.selection.bound, state.selection.type, state.selection.seq, state.selection.bsiCode)
    .then(data => {
      let msg = `${state.selection.route} `;
      msg += state.options.bounds.list.filter(bound => bound.bound == state.selection.bound && bound.type == state.selection.type)[0].text + '\n';

      msg += 'Stop: ';
      msg += state.options.stops.list.filter(stop => stop.seq == state.selection.seq)[0].text;

      if (state.dist) {
        msg += ` (${state.dist} m)`;
      }
      msg += '\n';

      if (data) {
        data.response.map(eta => {
          msg += `${eta.time} `;
          if (eta.scheduled) msg += '🕙';
          if (eta.wheelchair) msg += '♿️';
          msg += '\n';
        });
      } else {
        msg += 'There is no bus in coming hour. ';
      }
      return msg;
    }).then(msg => bot.sendMessage(state.chatid, msg, {
      reply_markup: JSON.stringify({
        keyboard: [
          [
            command.refresh.text, command.reset.text
          ]
          // [
          //   'Select another stop'
          // ]
        ],
        // one_time_keyboard: true,
        resize_keyboard: true,
        force_reply: false
      })
    }));
};

let reply = state => {
  switch (state.selection.progress) {
    case 0:
      return askForRoute(state);
    case 1:
      return askForBound(state);
    case 2:
      return askForStop(state);
    case 3:
      return replyETA(state);
    default:
      return 'Please proceed your selection. ';
  }
};

let defaultHandler = msg => {
  let text = msg.text;
  let chatid = msg.chat.id;

  return getState(chatid)
    .then(state => {
      let tokens = text.split('-');
      state.selection.progress = Math.min(state.selection.progress, 3 - tokens.length);

      let promise = Promise.resolve();
      for (let i = 0; i < tokens.length; ++i) {
        switch (state.selection.progress) {
          case 0:
            promise = promise.then(() => parseRoute(state, tokens[i]));
            break;
          case 1:
            promise = promise.then(() => parseBound(state, tokens[i]));
            break;
          case 2:
            promise = promise.then(() => parseStop(state, tokens[i]));
            break;
        }
        promise = promise.then(state => {
          state.selection.progress++;
          return state;
        });
      }
      return promise
        .then(() => state);
    })
    .then(state => setState(chatid, state))
    .then(state => reply(state))
    .catch(err => {
      console.error(err);
      if (typeof err === 'string') return err;
      return 'I cannot understand your meaning!\n' + err.toString();
    });
};

let locationHandler = msg => {
  return getState(msg.chat.id)
    .then(state => {
      if (msg !== undefined && msg.location !== undefined)
        state.location = msg.location;
      if (state.selection.progress == 2) {
        state.selection.progress = 3;
        state = parseStopByLocation(state);
      }
      return state;
    })
    .then(state => setState(state.chatid, state))
    .then(reply);
};

const handleObjects = [
  {
    regex: /\/start/,
    name: 'start',
    handler: start
  }, {
    regex: /\/myid$/,
    name: 'myid',
    handler: myid
  }, {
    regex: command.reset.regex,
    name: 'reset',
    handler: reset
  }, {
    regex: command.refresh.regex,
    name: 'reset',
    handler: refresh
  }, {
    regex: /\/state ?(\d+)?/,
    name: 'state',
    handler: myState
  }, {
    name: 'default',
    handler: defaultHandler
  }
  // }, {
  //   regex: /\/history/,
  //   name: 'history',
  //   handler: history,
  //   condition: msg => msg.chat.id == config.adminChatId

];

let locationHandlerObject = {
  name: 'location',
  handler: locationHandler
};

bot.on('message', msg => {
  let handle = handleObjects[handleObjects.length - 1];
  let match;

  if (msg.location) {
    handle = locationHandlerObject;
  } else {
    for (let thisHandle of handleObjects) {
      if (thisHandle.regex && (match = msg.text.match(thisHandle.regex))) {
        if (thisHandle.condition && !thisHandle.condition(msg)) continue;
        handle = thisHandle;
        break;
      }
    }
  }

  let promise = handle.handler ? handle.handler(msg, match) : handle.response;
  if (typeof promise === 'string') promise = Promise.resolve(promise);

  return promise
    .then(ret => {
      if (typeof ret === 'string') {
        return bot.sendMessage(msg.chat.id, ret);
      } else {
        return ret;
      }
    })
    .catch(err => console.error(err));
});

database.setupCollections()
  .then(() => console.log('Telegram bot started. '));
