const express = require('express');
const _ = require('lodash');

module.exports = function view({
  urlUtility: {
    regexComponentName,
    regexVersion,
    parseVersion,
  },
  daobase,
}) {
  const regexC = `(${regexComponentName})`;

  return express
    .Router()
    .get(new RegExp(`^/${regexC}(?:@(${regexVersion}))?$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1] || 'latest');

      res.render('bootloader', {
        component,
        version,
        daobase: daobase.replace(/\/?$/, '/'),
        resolve: _.has(req.query, 'resolve'),
      });
    });
};
