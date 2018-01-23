const _ = require('lodash');
const Promise = require('bluebird');
const express = require('express');
const { parseResourcePath } = require('./util');

module.exports = function resources({ storage, loaders = {} }) {
  return express
    .Router()
    .get('/*', (req, res) => {
      const {
        component,
        version,
        file,
      } = parseResourcePath(req.path);

      if (file) {
        Promise.props({
          source: storage.getSource({ component, version }),
          metadata: storage.getMetadata({ component, version }),
        })
          .then(({ source, metadata }) => {
            const { loader } = metadata;
            return (loaders[loader] || _.identity)(source, {
              component,
              version,
              file,
              metadata,
              query: req.query,
            });
          })
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
