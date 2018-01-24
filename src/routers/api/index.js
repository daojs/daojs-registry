const express = require('express');
const resolve = require('./resolve');

module.exports = function api(options) {
  return express
    .Router()
    .post('/resolve', resolve(options));
};
