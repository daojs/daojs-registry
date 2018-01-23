const rp = require('request-promise-native');
const _ = require('lodash');

module.exports = function cdnBuilder() {
  return (source, { query, metadata: { url, urlDebug = url }}) => {
    let requestUrl = url;
    if (_.has(query, 'debug')) {
      requestUrl = urlDebug;
    }

    return rp.get(requestUrl);
  }
};
