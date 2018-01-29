const _ = require('lodash');
const Promise = require('bluebird');
const { error } = require('../error');
const { isDaoComponent } = require('./url-utility');

function validator({ registry, loaders }) {
  function validateDescription(description) {
    return _.isString(description) ? description : '';
  }

  function validateDep(version, component) {
    if (!isDaoComponent(component)) {
      // TODO Check npm package dependency
      return version;
    }

    if (parseInt(version, 10) !== version || version < 0) {
      error(400, 'Invalid dependenecy version');
    }

    return registry.getVersion(component)
      .catch(() => error(400, 'Dependency component does not exist'))
      .then((ver) => {
        if (ver < version) {
          error(400, 'Dependency version does not exist');
        }
        return version;
      });
  }

  function validateDependencies(dependencies) {
    return Promise.props(_.mapValues(dependencies, validateDep));
  }

  function validateType(type) {
    if (!_.isFunction(loaders[type])) {
      error(400, 'Unrecognized component type');
    }
    return type;
  }

  function validateSource(source) {
    if (!_.isString(source)) {
      error(400, 'Invalid component source');
    }
    return source;
  }

  function validateReadme(readme = '') {
    if (!_.isString(readme)) {
      error(400, 'Invalid component readme');
    }
    return readme;
  }

  function validateComponent({
    description,
    dependencies,
    type,
    source,
    readme,
  }) {
    return Promise.props({
      description: validateDescription(description),
      dependencies: validateDependencies(dependencies),
      type: validateType(type),
      source: validateSource(source),
      readme: validateReadme(readme),
    });
  }

  return {
    validateComponent,
  };
}

module.exports = validator;
