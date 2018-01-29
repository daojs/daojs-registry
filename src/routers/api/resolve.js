const express = require('express');
const _ = require('lodash');
const { reportError } = require('../../error');
const {
  regexDaoComponentName,
  parseVersion,
} = require('../url-utility');

module.exports = function resolve({ registry }) {
  const regexV = `^/(${regexDaoComponentName})$`;

  function handler(req, res, locked) {
    const component = req.params[0];
    const version = parseVersion(req.query.v);

    registry
      .resolve({
        entry: component,
        locked: version > 0 ? _.defaults({
          [component]: version,
        }, locked) : locked,
      })
      .then(data => res.jsonp(data))
      .catch(reportError(res));
  }

  return express.Router()
    .get(new RegExp(regexV), (req, res) => handler(req, res, {}))
    .post(new RegExp(regexV), (req, res) => handler(req, res, req.body));
};
