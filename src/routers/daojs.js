const express = require('express');
const bodyParser = require('body-parser');

const registry = require('../registry');
const resources = require('./resources');
const api = require('./api');

function daojs({ storage, loaders }) {
  const options = {
    registry: registry(storage),
    loaders,
  };

  return express
    .Router()
    .use(bodyParser.json())
    .use('/resources', resources(options))
    .use('/api', api(options));
}

module.exports = daojs;
