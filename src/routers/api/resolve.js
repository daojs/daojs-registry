const Promise = require('bluebird');
const _ = require('lodash');
const { error, reportError } = require('../error');

module.exports = function resolve({ registry }) {
  return (req, res) => {
    const { entry, versions: locked = {} } = req.body;
    const versions = {};
    const conflicts = [];

    function resolveComponent(component, chain = [component]) {
      if (_.has(versions, component)) {
        return Promise.resolve();
      }

      return Promise
        .resolve(locked[component] || registry.getVersion(component))
        .tap((version) => { versions[component] = version; })
        .then(version => registry.getMetadata(component, version))
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

    resolveComponent(entry)
      .then(() => res.jsonp({ entry, versions, conflicts }))
      .catch(reportError(res));
  };
};
