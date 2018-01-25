const _ = require('lodash');
const { error } = require('../error');

function waterfallStorage({ storages = [] }) {
  function hits(condition, node) {
    if (_.isUndefined(condition)) {
      return true;
    }
    if (_.isString(condition)) {
      return node.startsWith(condition.replace(/\/?$/, '/'));
    }
    if (_.isRegExp(condition)) {
      return Boolean(node.match(condition));
    }
    if (_.isFunction(condition)) {
      return Boolean(condition(node));
    }
    return false;
  }

  function findStorage(node) {
    const {
      storage,
    } = _.find(storages, ({ condition }) => hits(condition, node)) || {};

    if (!storage) {
      error(404, 'Component does not exist');
    }

    return storage;
  }

  return {
    getVersion: node => findStorage(node).getVersion(node),
    getChildren: node => findStorage(node).getChildren(node),
    getBlob: (node, name, version) => findStorage(node).getBlob(node, name, version),
    update: (node, blobs) => findStorage(node).update(node, blobs),
  };
}

module.exports = waterfallStorage;

