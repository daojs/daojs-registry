const _ = require('lodash');
const Promise = require('bluebird');
const rp = require('request-promise');
const { error } = require('./error');

function registry(storage) {
  function getMetadata(component, version = 0) {
    return storage
      .getBlob(component, 'metadata.json', version)
      .then(JSON.parse);
  }

  function getSource(component, version = 0, debug = false) {
    return getMetadata(component, version)
      .then(({ source, sourceDebug }) => (debug && sourceDebug) || source)
      .then(({ isUrl, name, url }) => ({
        isUrl,
        data: isUrl ? url : storage.getBlob(component, name, version),
      }))
      .props();
  }

  function getCodeAndMetadata(component, version = 0, debug = false) {
    return getMetadata(component, version)
      .then(metadata => ({
        metadata,
        name: ((debug && metadata.sourceDebug) || metadata.source).name,
      }))
      .then(({ metadata, name }) => ({
        metadata,
        code: storage.getBlob(component, name, version),
      }))
      .props();
  }

  function getReadme(component, version = 0) {
    return storage.getBlob(component, 'README.md', version);
  }

  function updateComponent(component, {
    dependencies,
    description,
    type,
    source,
    sourceDebug,
    readme,
  }) {
    const metadata = { dependencies, type, description };
    const files = { source, sourceDebug, readme };
    const blobs = {};

    _.forEach({
      source: 'source',
      sourceDebug: 'source.debug',
      readme: 'README.md',
    }, (name, key) => {
      if (files[key]) {
        const { isUrl, data } = files[key];
        metadata[key] = { isUrl, name };
        if (isUrl) {
          metadata[key].url = data;
        }
        blobs[name] = isUrl ? rp.get(data) : data;
      }
    });

    blobs['metadata.json'] = JSON.stringify(metadata);

    return Promise.props(blobs)
      .then(b => storage.update(component, b));
  }

  function resolve({ entry, locked }) {
    const versions = {};
    const conflicts = [];

    function resolveComponent(component, chain = [component]) {
      if (_.has(versions, component)) {
        return Promise.resolve();
      }

      return Promise
        .resolve(locked[component] || storage.getVersion(component))
        .tap((version) => { versions[component] = version; })
        .then(version => getMetadata(component, version))
        .get('dependencies')
        .then(_.toPairs)
        .map(([comp, descriptor]) => {
          const v = _.isNumber(descriptor) ? descriptor : (descriptor.version || 0);
          const idx = _.indexOf(chain, comp);

          if (idx >= 0) {
            const cycle = chain.slice(idx);
            cycle.push(comp);
            error(400, `Circular dependency detected ${
              cycle.map(c => `${c}@${versions[c]}`).join(' -> ')
            }`);
          }

          if (_.has(locked, comp) && locked[comp] < v) {
            conflicts.push({
              from: component,
              to: comp,
              expected: v,
              actual: locked[comp],
            });
          }

          return resolveComponent(comp, chain.concat([comp]));
        })
        .all();
    }

    return resolveComponent(entry)
      .then(() => ({ entry, versions, conflicts }));
  }

  return _.extend({
    getMetadata,
    getSource,
    getCodeAndMetadata,
    getReadme,
    updateComponent,
    resolve,
  }, storage);
}

module.exports = registry;
