const _ = require('lodash');
const Promise = require('bluebird');
const { error } = require('./error');

function validator({ registry, loaders }) {
  function validateDescription(description) {
    return _.isString(description) ? description : '';
  }

  function validateDep(descriptor, component) {
    const version = _.isNumber(descriptor) ? descriptor : descriptor.verison;

    if (parseInt(version, 10) !== version || version < 0) {
      error(400, 'Invalid dependenecy version');
    }

    return registry.getVersion(component)
      .catch(() => error(400, 'Dependency component does not exist'))
      .then((ver) => {
        if (ver < version) {
          error(400, 'Dependency version does not exist');
        }
        return descriptor;
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
    if (!_.isObject(source) || !_.isString(source.data)) {
      error(400, 'Invalid component source');
    }
    return source;
  }

  function validateSourceDebug(sourceDebug) {
    if (!_.isUndefined(sourceDebug) && !_.isString(sourceDebug.data)) {
      error(400, 'Invalid component sourceDebug');
    }
    return sourceDebug;
  }

  function validateReadme(readme) {
    if (_.isUndefined(readme)) {
      return { data: '' };
    }
    if (!_.isObject(readme) || !_.isString(readme.data)) {
      error(400, 'Invalid component readme');
    }
    return readme;
  }

  function validateComponent({
    description,
    dependencies,
    type,
    source,
    sourceDebug,
    readme,
  }) {
    return Promise.props({
      description: validateDescription(description),
      dependencies: validateDependencies(dependencies),
      type: validateType(type),
      source: validateSource(source),
      sourceDebug: validateSourceDebug(sourceDebug),
      readme: validateReadme(readme),
    });
  }

  return {
    validateComponent,
  };
}

module.exports = validator;
