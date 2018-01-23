const rp = require('request-promise-native');
const _ = require('lodash');

module.exports = function cdnBuilder() {
  return (source, { query, metadata: { urls }}) => {
    const output = 'release';
    if (_.has(query, 'debug')) {
      output = 'debug';
    }

    return rp.get(urls[output]);
  }
};
