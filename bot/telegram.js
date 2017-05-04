const TelegramBot = require('node-telegram-bot-api');
const geolib = require('geolib');

const config = require('../config').Telegram;
const DataSource = require('../core/datasource');
const util = require('../core/util');

const bot = new TelegramBot(config.token, {polling: true});

const record = {};
const state = {};

const lang = 'chi';

let recordHistory = (handleName, msg, res = '') => {
  let ret = {
    time: new Date().getTime(),
    handle: handleName,
    message: msg,
    response: res
  };

  if (!record[msg.chat.id]) record[msg.chat.id] = [];
  record[msg.chat.id] = [
    ...record[msg.chat.id],
    ret
  ];

  return ret;
};

let initState = chatid => ({
  chatid: chatid,
  progress: 0
});

let myid = msg => `Your chat id is ${msg.chat.id}`;
let history = msg => history[msg.chat.id] ? history[msg.chat.id].map(JSON.stringify) : 'EMPTY';
let getState = id => state[id] ? state[id] : (state[id] = initState(id));
let setState = (id, inState = initState(id)) => state[id] = inState;

let reset = (msg, match) => {
  let id = msg.chat.id;
  if (match[1] !== undefined) id = match[1];
  if (id != msg.chat.id && msg.chat.id != config.adminChatId)
    id = msg.chat.id;
  setState(id, initState(id));
  return 'The state has been reset';
};

let myState = (msg, match) => {
  let id = msg.chat.id;
  if (match.length > 2) id = match[1];
  if (id != msg.chat.id && msg.chat.id != config.adminChatId)
    id = msg.chat.id;
  return JSON.stringify(getState(id));
};

let start = msg => {
  if (!getState(msg.chat.id)) state[msg.chat.id] = initState(msg.chat.id);
  return 'Welcome. You can now start using this bot. ';
};

let askForRoute = state => {
  return bot.sendMessage(state.chatid, 'Please type the route. ');
};

let parseRoute = (state, input) => {
  return input.toUpperCase();
};

let askForBound = state => {
  return DataSource.getBoundsInfo(state.route)
    .then(bounds => {
      state.boundOptions = bounds.map(bound => ({
        bound: bound.bound,
        type: bound.type,
        text: `${bound.origin[lang]}➡️${bound.destination[lang]}`,
      }));
      return bot.sendMessage(state.chatid, 'Please select the direction. ', {
        reply_markup: JSON.stringify({
          keyboard: [
            state.boundOptions
          ],
          // one_time_keyboard: true,
          resize_keyboard: true
        })
      });
    });
};

let parseBound = (state, input) => {
  if (!isNaN(parseInt(input))) return parseInt(input);
  for (let i = 0; i < state.boundOptions.length; ++i)
    if (input === state.boundOptions[i].text)
      return state.boundOptions[i];
  return undefined;
};

let askForStop = state => {
  return DataSource.getStops(state.route, state.bound, state.type)
    .then(stops => {
      state.stopOptions = stops.map(stop => ({
        seq: stop.seq,
        text: stop.name[lang],
        location: stop.location,
        bsiCode: stop.bsiCode
      }));
      return bot.sendMessage(state.chatid, 'Please select the stop', {
        reply_markup: JSON.stringify({
          keyboard: [
            [
              {
                text: 'Find stop by my location',
                request_location: true
              }
            ],
            ...util.arrayToGrid(state.stopOptions, 3),
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
          force_reply: false
        })
      });
    });
};

let parseStop = (state, input) => {
  if (!isNaN(parseInt(input))) return parseInt(input);
  for (let i = 0; i < state.stopOptions.length; ++i)
    if (input === state.stopOptions[i].text)
      return state.stopOptions[i];
  return undefined;
};

let replyETA = state => {
  return DataSource.getETA(state.route, state.bound, state.type, state.seq, state.bsiCode)
    .then(data => {
      let msg = `${state.route} `;
      msg += state.boundOptions.filter(bound => bound.bound == state.bound && bound.type == state.type)[0].text + '\n';

      msg += 'Stop: ';
      msg += state.stopOptions.filter(stop => stop.seq == state.seq)[0].text;

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
    })
    .then(msg => bot.sendMessage(state.chatid, msg));
};

let handleState = state => {
  switch (state.progress) {
    // case 0:
    //   break;
    case 1:
      return askForBound(state);
    case 2:
      return askForStop(state);
    case 3:
      return replyETA(state);
    default:
      return bot.sendMessage(state.chatid, JSON.stringify(state));
  }
};

let defaultHandler = msg => {
  let text = msg.text;
  let chatid = msg.chat.id;

  return Promise.resolve(getState(chatid))
    .then(inState => {
      let state = Object.assign({}, inState);

      let tokens = text.split('-');
      state.progress = Math.min(state.progress, 3 - tokens.length);

      let obj = undefined;

      for (let i = 0; i < tokens.length; ++i) {
        switch (state.progress) {
          case 0:
            state.route = parseRoute(state, tokens[i]);
            break;
          case 1:
            obj = parseBound(state, tokens[i]);
            state.bound = obj.bound;
            state.type = obj.type;
            break;
          case 2:
            obj = parseStop(state, tokens[i]);
            state.seq = obj.seq;
            state.bsiCode = obj.bsiCode;
            delete state.dist;
            break;
        }
        state.progress++;
      }
      setState(chatid, state);
      return state;
    })
    .then(state => handleState(state));
    // .catch(err => bot.sendMessage(chatid, 'Unaccepted format. ' + JSON.stringify(err)));
};

let getNearestStop = state => {
  console.log(state.stopOptions);
  let dists = state.stopOptions.map(stop => geolib.getDistance(state.location, stop.location));
  let id = dists.indexOf(Math.min.apply(null, dists));
  return {seq: id, dist: dists[id]};
};

let locationHandler = msg => {
  let state = Object.assign({}, getState(msg.chat.id));
  state.location = msg.location;
  if (state.progress == 2) {
    state.progress = 3;
    let nearestData = getNearestStop(state);
    state.seq = state.stopOptions[nearestData.id].seq;
    state.bsiCode = state.stopOptions[nearestData.id].bsiCode;
    state.dist = nearestData.dist;
  }
  setState(msg.chat.id, state);
  return handleState(state);
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
    regex: /\/history/,
    name: 'history',
    handler: history,
    condition: msg => msg.chat.id == config.adminChatId
  }, {
    regex: /\/reset ?(\d+)?/,
    name: 'reset',
    handler: reset
  }, {
    regex: /\/state ?(\d+)?/,
    name: 'state',
    handler: myState
  }, {
    name: 'default',
    handler: defaultHandler
  }
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

  let res = handle.handler ? handle.handler(msg, match) : handle.response;

  if (typeof res === 'string') {
    recordHistory(handle.name, msg, res);
    return bot.sendMessage(msg.chat.id, res);
  } else {
    return res.catch(console.error);
  }
});

console.log('Telegram bot started. ');
