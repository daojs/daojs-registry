const express = require('express');
const bodyParser = require('body-parser');

const resources = require('./resources');
const api = require('./api');
const { FSStorage } = require('./storage');

function daojs({ storage }) {
  return express
    .Router()
    .use(bodyParser.json())
    .use('/resources', resources({ storage }))
    .use('/api', api({ storage }));
}

module.exports = { daojs, FSStorage };
