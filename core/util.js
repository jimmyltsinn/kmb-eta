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

module.exports = {
  filterObjectByKeys,
  getBody,
  removeTags,
  replaceNewLineCharacter
};
