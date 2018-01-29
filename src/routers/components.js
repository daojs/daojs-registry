const _ = require('lodash');
const Promise = require('bluebird');
const express = require('express');
const {
  regexDaoComponentName,
  parseVersion,
} = require('./url-utility');
const { reportError } = require('../error');
const validator = require('./validator');

module.exports = function components({ registry, loaders }) {
  const { validateComponent } = validator({ registry, loaders });

  return express.Router()
    .get(new RegExp(`^/(${regexDaoComponentName})$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.query.v);

      registry
        .getComponent(component, version)
        .then(data => res.jsonp(data))
        .catch(reportError(res));
    })
    .post(new RegExp(`^/(${regexDaoComponentName})$`), (req, res) => {
      const component = req.params[0];

      Promise.resolve(req.body)
        .then(validateComponent)
        .then(payload => registry.updateComponent(component, payload))
        .then(version => res.send({ version }))
        .catch(reportError(res));
    });
};
