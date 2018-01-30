const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { error } = require('../error');

function handleError(err) {
  if (err.code === 'ENOENT') {
    console.log(err.stack);
    error(404, 'Component or version does not exist');
  }
  throw err;
}

function romStorage({ root }) {
  function getVersion(/* node */) {
    return Promise.resolve(1);
  }

  function getChildren(node) {
    return Promise
      .resolve(fs.readdir(path.join(root, node)))
      .filter((name) => {
        if (name.startsWith('.')) {
          return false;
        }

        return Promise
          .resolve(fs.stat(path.join(root, node, name)))
          .then(stat => stat.isDirectory())
          .catch(_.constant(false));
      })
      .catch(handleError);
  }

  function getBlob(node, name) {
    return new Promise((resolve) => {
      const content = fs.readFileSync(path.join(root, node, 'metadata.json'), 'utf8');
      const metadata = JSON.parse(content);
      switch (name) {
        case 'source':
          resolve(fs.readFileSync(path.join(root, node, metadata.source.name), 'utf8'));
          break;
        case 'metadata':
          resolve(JSON.stringify(_.omit(metadata, 'source')));
          break;
        default:
          resolve('');
      }
    });
  }

  function update(/* node, blobs */) {
    return new Promise(() => error(401, 'No permission to write rom node'));
  }

  return {
    getVersion,
    getChildren,
    getBlob,
    update,
  };
}

module.exports = romStorage;
