const _ = require('lodash');
const Promise = require('bluebird');
const express = require('express');
const { parseResourcePath } = require('./util');
const { error, reportError } = require('./error');

function handleError(err) {
  if (err.code === 'ENOENT') {
    error(404, 'Component or version does not exist');
  }
  throw err;
}

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
          .then(source => res.send(source))
          .catch(handleError)
          .catch(reportError(res));
      } else if (version) {
        storage
          .getMetadata({ component, version })
          .then(metadata => res.send(metadata))
          .catch(handleError)
          .catch(reportError(res));
      } else {
        storage
          .getInfo({ component })
          .then(info => res.send(info))
          .catch(handleError)
          .catch(reportError(res));
      }
    })
    .post('/*', (req, res) => {
      const { component } = parseResourcePath(req.path);
      const {
        source,
        metadata,
      } = req.body;
      const { dependencies } = metadata;
      const invalidDeps = [];

      Promise.resolve(dependencies)
        .then(_.toPairs)
        .map(([comp, descriptor]) => {
          const version = _.isNumber(descriptor) ? descriptor : descriptor.version;
          const target = { component: comp, version };

          if (comp === component) {
            invalidDeps.push(target);
            return null;
          }

          if (parseInt(version, 10) !== version) {
            invalidDeps.push(target);
            return null;
          }
          return storage
            .getMetadata(target)
            .catch(() => {
              invalidDeps.push(target);
            });
        })
        .all()
        .then(() => {
          if (!_.isEmpty(invalidDeps)) {
            error(400, `Invalid dependencies ${
              invalidDeps
                .map(({ component: c, version: v }) => `${c}@${v}`)
                .join(', ')
            }`);
          }
        })
        .then(() => storage.set({ component, source, metadata }))
        .then(version => res.send({ version }))
        .catch(handleError)
        .catch(reportError(res));
    });
};
