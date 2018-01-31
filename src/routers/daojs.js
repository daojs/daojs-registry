const express = require('express');
const bodyParser = require('body-parser');

const registry = require('../registry');
const api = require('./api');

const components = require('./components');
const assets = require('./assets');
const list = require('./list');

function daojs({ storage, loaders }) {
  const options = {
    registry: registry(storage),
    loaders,
  };

  return express
    .Router()
    .use(bodyParser.json())
    .use('/components', components(options))
    .use('/assets', assets(options))
    .use('/list', list(options))
    .use('/api', api(options));
}

module.exports = daojs;
