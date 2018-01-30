const _ = require('lodash');
const rp = require('request-promise');
const Promise = require('bluebird');
const express = require('express');
const mimeTypes = require('mime-types');
const {
  regexComponentName,
  isDaoComponent,
  parseVersion,
  getCdnjsUrl,
} = require('./url-utility');
const { reportError } = require('../error');

module.exports = function scripts({ registry, loaders = {} }) {
  function loadNpmScript({ component, version = 'latest', debug }) {
    const url = getCdnjsUrl({ component, version, debug });
    if (url) {
      return rp.get(url);
    }
    return Promise.resolve('No npm package defined in yaml');
  }

  function loadDaoScript({ component, version, debug }) {
    return registry
      .getComponent(component, version, debug)
      .then(({
        source,
        dependencies,
        type,
      }) => (loaders[type] || _.identity)(source, {
        component,
        version,
        debug,
        dependencies,
      }));
  }

  function loadScript({ component, version, debug }) {
    return (isDaoComponent(component) ? loadDaoScript : loadNpmScript)({
      component,
      version,
      debug,
    });
  }

  function loadVersion({ component, strVer }) {
    // Version is a lock component
    if (isDaoComponent(strVer)) {
      return loadScript({
        component: strVer,
        version: 0,
      })
        .then(JSON.parse)
        .then(lock => _.get(lock, `versions.${component}`, 0));
    }

    // Parse Dao component version
    if (isDaoComponent(component)) {
      return Promise.resolve(parseVersion(strVer));
    }

    // Npm package, return the version string directly
    return Promise.resolve(strVer);
  }

  return express.Router()
    .get(new RegExp(`^/(${regexComponentName}).js`), (req, res) => {
      const component = req.params[0];

      loadVersion({ component, strVer: req.query.v })
        .then(version => loadScript({
          component,
          version,
          debug: _.has(req.query, 'debug'),
        }))
        .then((script) => {
          res
            .set('Content-Type', mimeTypes.contentType('.js'))
            .send(script);
        })
        .catch(reportError(res));
    });
};
