const express = require('express');

module.exports = function view({
  urlUtility: {
    regexComponentName,
    regexVersion,
    parseVersion,
  },
  resources,
}) {
  const regexC = `(${regexComponentName})`;
  return express
    .Router()
    .get(new RegExp(`^/${regexC}(?:@(${regexVersion}))?$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1] || 'latest');

      res.render('bootloader', { component, version, resources });
    });
};
