const _ = require('lodash');
const Promise = require('bluebird');
const rp = require('request-promise');

function registry(storage) {
  function getMetadata(component, version = 0) {
    return storage
      .getBlob(component, 'metadata.json', version)
      .then(JSON.parse);
  }

  function getSource(component, version = 0, debug = false) {
    return getMetadata(component, version)
      .then(({ source, sourceDebug }) => (debug && sourceDebug) || source)
      .then(({ isUrl, name }) => ({
        isUrl,
        data: isUrl ? name : storage.getBlob(component, name, version),
      }))
      .props();
  }

  function getCodeAndMetadata(component, version = 0, debug = false) {
    return getMetadata(component, version)
      .then(metadata => ({
        metadata,
        name: debug && metadata.sourceDebug ? 'source.debug' : 'source',
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
        metadata[key] = { isUrl, name: isUrl ? data : name };
        blobs[name] = isUrl ? rp.get(data) : data;
      }
    });

    blobs['metadata.json'] = JSON.stringify(metadata);

    return Promise.props(blobs)
      .then(b => storage.update(component, b));
  }

  return _.extend({
    getMetadata,
    getSource,
    getCodeAndMetadata,
    getReadme,
    updateComponent,
  }, storage);
}

module.exports = registry;
