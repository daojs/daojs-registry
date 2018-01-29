const express = require('express');
const Promise = require('bluebird');
const {
  regexDaoComponentName,
} = require('./url-utility');
const { reportError } = require('../error');

module.exports = function list({ registry }) {
  return express.Router()
    .get(new RegExp(`^/(${regexDaoComponentName})/?$`), (req, res) => {
      const component = req.params[0];
      console.log(component);

      Promise.props({
        version: registry.getVersion(component).catch(() => undefined),
        children: registry.getChildren(component),
      })
        .then(info => res.jsonp(info))
        .catch(reportError(res));
    });
};
