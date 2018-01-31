const express = require('express');
const _ = require('lodash');

module.exports = function view({
  urlUtility: {
    regexComponentName,
  },
  daobase,
}) {
  const regexC = `(${regexComponentName})`;

  return express
    .Router()
    .get(new RegExp(`^/${regexC}$`), (req, res) => {
      const component = req.params[0];
      const version = req.query.v || 'latest';

      res.render('bootloader', {
        component,
        version,
        daobase: daobase.replace(/\/?$/, '/'),
      });
    });
};
