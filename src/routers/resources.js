const _ = require('lodash');
const Promise = require('bluebird');
const express = require('express');
const {
  regexComponentName,
  regexVersion,
  parseVersion,
} = require('./url-utility');
const { reportError } = require('../error');
const validator = require('./validator');

module.exports = function resources({ registry, loaders = {} }) {
  const regexC = `(${regexComponentName})`;
  const regexV = `${regexC}@(${regexVersion})`;
  const { validateComponent } = validator({ registry, loaders });

  return express.Router()
    // Get source json
    .get(new RegExp(`^/${regexV}/source(\\.debug)?\\.json$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1]);
      const debug = Boolean(req.params[2]);

      registry
        .getSource(component, version, debug)
        .then(source => res.jsonp(source))
        .catch(reportError(res));
    })

    // Get generated script
    .get(new RegExp(`^/${regexV}/index(\\.debug)?\\.js$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1]);
      const debug = Boolean(req.params[2]);

      registry
        .getCodeAndMetadata(component, version, debug)
        .then(({
          code,
          metadata,
        }) => (loaders[metadata.type] || _.identity)(code, {
          component,
          version,
          debug,
          metadata,
        }))
        .then(script => res.send(script))
        .catch(reportError(res));
    })
    // Get README.md
    .get(new RegExp(`^/${regexV}/README.md$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1]);

      registry
        .getReadme(component, version)
        .then(readme => res.send(readme))
        .catch(reportError(res));
    })

    // Get metadata json
    .get(new RegExp(`^/${regexV}$`), (req, res) => {
      const component = req.params[0];
      const version = parseVersion(req.params[1]);
      registry
        .getMetadata(component, version)
        .then(metadata => res.jsonp(metadata))
        .catch(reportError(res));
    })

    // Get child components
    .get(new RegExp(`^/${regexC}/$`), (req, res) => {
      const component = req.params[0];
      registry
        .getChildren(component)
        .then(children => res.send(children))
        .catch(reportError(res));
    })

    // Get component metadata
    .get(new RegExp(`^/${regexC}$`), (req, res) => {
      const component = req.params[0];
      registry
        .getVersion(component)
        .then(version => res.send({ version }))
        .catch(reportError(res));
    })

    // Publish new component/version
    .post(new RegExp(`^/${regexC}$`), (req, res) => {
      const component = req.params[0];

      Promise.resolve(req.body)
        .then(validateComponent)
        .then(payload => registry.updateComponent(component, payload))
        .then(version => res.send({ version }))
        .catch(reportError(res));
    });
};
