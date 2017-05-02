function filterObjectByKeys(obj, keys) {
  return Object.keys(obj)
    .filter(key => keys.includes(key))
    .reduce((ret, k) => {
      ret[k] = obj[k];
      return ret;
    }, {});
}

const getBody = html => html.match(/<body>((?:.|\r|\n)*)<\/body>/m)[0];
const removeTags = text => text.replace(/\<[^>]*\>/g, '').trim();
const replaceNewLineCharacter = text => text.replace(/\r\n/g, '\n');

const arrayToGrid = (arr, len) => {
  let ret = [];
  arr.map((item, i) => {
    let row = Math.floor(i / len);
    if (!ret[row]) ret[row] = [];
    ret[row].push(item);
  });
  return ret;
};

// const toCamelCase = str => str.toLowerCase().split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ').trim();

const toCamelCase = str => {
  return str.toLowerCase().split(/ +/).map(word => {
    if (word.length < 1) return '';
    if (!(/^[a-zA-Z]+$/.test(word))) return word.toUpperCase();
    return word[0].toUpperCase() + word.slice(1);
  }).join(' ').trim();
};

const shuffle = arr => {
  let cnt = arr.length;
  while (cnt > 0) {
    let i = Math.floor(Math.random() * cnt);
    cnt--;
    [arr[cnt], arr[i]] = [arr[i], arr[cnt]];
  }
};

module.exports = {
  filterObjectByKeys,
  getBody,
  removeTags,
  replaceNewLineCharacter,
  arrayToGrid,
  toCamelCase,
  shuffle
};
