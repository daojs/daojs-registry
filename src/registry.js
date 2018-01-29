const _ = require('lodash');
const Promise = require('bluebird');
const { error } = require('./error');
const { isDaoComponent } = require('./routers/url-utility');

function registry(storage) {
  function getMetadata(component, version = 0) {
    return storage
      .getBlob(component, 'metadata', version)
      .then(JSON.parse);
  }

  function getSource(component, version = 0) {
    return storage.getBlob(component, 'source', version);
  }

  function getReadme(component, version = 0) {
    return storage.getBlob(component, 'readme', version);
  }

  function getComponent(component, version = 0) {
    return Promise.all([
      getMetadata(component, version),
      getSource(component, version),
      getReadme(component, version),
    ])
      .spread((metadata, source, readme) => _.defaults({
        source,
        readme,
      }, metadata));
  }

  function updateComponent(component, {
    dependencies,
    description,
    type,
    source,
    readme,
  }) {
    return storage.update(component, {
      source,
      readme,
      metadata: JSON.stringify({
        type,
        description,
        dependencies,
      }),
    });
  }

  function resolve({ entry, locked }) {
    const versions = {};
    const conflicts = [];

    function resolveComponent(component, chain = [component]) {
      if (_.has(versions, component) || !isDaoComponent(component)) {
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
    getReadme,
    getComponent,
    updateComponent,
    resolve,
  }, storage);
}

module.exports = registry;
