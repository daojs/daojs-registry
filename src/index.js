const daojs = require('./routers/daojs');
const urlUtility = require('./routers/url-utility');
const storages = require('./storages');
const loaders = require('./loaders');

module.exports = {
  daojs,
  storages,
  loaders,
  urlUtility,
};
