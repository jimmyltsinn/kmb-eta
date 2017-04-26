const TelegramBot = require('node-telegram-bot-api');

const config = require('../config').Telegram;

const bot = new TelegramBot(config.token, {polling: true});

const record = {};
const state = {};

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
  if (match) id = match[1];
  if (id != msg.chat.id && msg.chat.id != config.adminChatId)
    id = msg.chat.id;
  setState(id);
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

let handleState = state => {
  return bot.sendMessage(state.chatid, JSON.stringify(state));
};

let defaultHandler = msg => {
  let text = msg.text;
  let chatid = msg.chat.id;

  return Promise.resolve(getState(chatid))
    .then(inState => {
      let state = Object.assign({}, inState);

      let tokens = text.split('-');
      state.progress = Math.min(state.progress, 3 - tokens.length);

      for (let i = 0; i < tokens.length; ++i) {
        switch (state.progress) {
          case 0:
            state.route = tokens[i].toUpperCase();
            break;
          case 1:
            state.bound = parseInt(tokens[i]);
            break;
          case 2:
            state.stop = parseInt(tokens[i]);
            break;
        }
        state.progress++;
      }
      setState(chatid, state);
      return state;
    })
    .then(state => handleState(state))
    .catch(res => bot.sendMessage(chatid, 'Unaccepted format. '));
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

bot.on('message', msg => {
  let handle = handleObjects[handleObjects.length - 1];
  let match;

  for (let thisHandle of handleObjects) {
    if (thisHandle.regex && (match = msg.text.match(thisHandle.regex))) {
      if (thisHandle.condition && !thisHandle.condition(msg)) continue;
      handle = thisHandle;
      break;
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
