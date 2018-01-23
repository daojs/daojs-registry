const express = require('express');
const bodyParser = require('body-parser');

const resources = require('./resources');
const api = require('./api');
const storages = require('./storages');
const loaders = require('./loaders');

function daojs(options) {
  return express
    .Router()
    .use(bodyParser.json())
    .use('/resources', resources(options))
    .use('/api', api(options));
}

module.exports = { daojs, storages, loaders };
