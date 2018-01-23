const Promise = require('bluebird');
const _ = require('lodash');
const { reportError } = require('../error');

module.exports = function resolve({ storage }) {
  return (req, res) => {
    const { entry, versions: lock = {} } = req.body;
    const versions = {};
    const conflicts = [];

    function resolveComponent(component) {
      if (_.has(versions, component)) {
        return Promise.resolve();
      }

      return Promise
        .resolve(lock[component] || storage.getInfo({ component }).get('version'))
        .tap((version) => { versions[component] = version; })
        .then(version => storage.getMetadata({ component, version }))
        .get('dependencies')
        .map((descriptor, comp) => {
          const v = _.isNumber(descriptor) ? descriptor : (descriptor.version || 0);

          if (_.has(lock, comp) && lock[comp] < v) {
            conflicts.push({
              from: component,
              to: comp,
              expected: v,
              actual: lock[comp],
            });
          }

          return resolveComponent(comp);
        })
        .all();
    }

    resolveComponent(entry)
      .then(() => res.jsonp({ entry, versions, conflicts }))
      .catch(reportError(res));
  };
};
