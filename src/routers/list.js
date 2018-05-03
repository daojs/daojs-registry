const express = require('express');
const Promise = require('bluebird');
const _ = require('lodash');
const {
  regexDaoComponentName,
} = require('./url-utility');
const { reportError } = require('../error');

module.exports = function list({ registry }) {
  return express.Router()
    .get(new RegExp(`^/(${regexDaoComponentName})/?$`), (req, res) => {
      const component = req.params[0];

      Promise.props({
        version: registry.getVersion(component).catch(() => undefined),
        children: registry.getChildren(component).map(child => registry
          .getBlob(`${component}/${child}`, 'metadata')
          .then(childMeta => _.pick(JSON.parse(childMeta), ['category']))
          .then(childMeta => ({ name: child, ...childMeta }))
          .catch(() => ({ name: child }))),
      })
        .then(info => res.jsonp(info))
        .catch(reportError(res));
    });
};
