const express = require('express');
const { parseResourcePath } = require('./util');

module.exports = function resources({ storage }) {
  return express
    .Router()
    .get('/*', (req, res) => {
      const {
        component,
        version,
        file,
      } = parseResourcePath(req.path);

      if (file) {
        storage
          .getSource({ component, version })
          .then(source => res.send(source));
      } else if (version) {
        storage
          .getMetadata({ component, version })
          .then(metadata => res.send(metadata));
      } else {
        storage
          .getInfo({ component })
          .then(info => res.send(info));
      }
    })
    .post('/*', (req, res) => {
      const { component } = parseResourcePath(req.path);
      const {
        source,
        metadata,
      } = req.body;
      storage
        .set({ component, source, metadata })
        .then(version => res.send({ version }));
    });
};
