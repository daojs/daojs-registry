const Promise = require('bluebird');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const ReadWriteLock = require('rwlock');
const { error } = require('../error');

function handleError(err) {
  if (err.code === 'ENOENT') {
    console.log(err.stack);
    error(404, 'Component or version does not exist');
  }
  throw err;
}

function fsStorage({ root }) {
  const lock = new ReadWriteLock();
  const {
    readLock,
    writeLock,
  } = _.chain(lock)
    .bindAll('readLock', 'writeLock')
    .mapValues(func => cb => (...args) => new Promise((resolve) => {
      func(args[0], resolve);
    }).then(release => cb(...args).finally(release)))
    .value();

  function getVersion(node) {
    return Promise
      .resolve(fs.readFile(path.join(root, node, '.v', 'latest')))
      .then(version => parseInt(version, 10))
      .catch(handleError);
  }

  function getChildren(node) {
    return Promise
      .resolve(fs.readdir(path.join(root, node)))
      .filter(name => !name.startsWith('.'))
      .catch(handleError);
  }

  function getBlob(node, name, version = 0) {
    return Promise
      .resolve(version > 0 ? 0 : getVersion(node))
      .then(base => base + version)
      .then(ver => ver.toString())
      .then(strVer => path.join(root, node, '.v', strVer, name))
      .then(filePath => fs.readFile(filePath, 'utf8'))
      .catch(handleError);
  }

  function update(node, blobs) {
    const pathV = path.join(root, node, '.v');
    let version;

    return getVersion(node)
      .catch(_.constant(0))
      .then(ver => ver + 1)
      .tap((ver) => { version = ver; })
      .then(ver => ver.toString())
      .tap(strVer => fs.mkdirp(path.join(pathV, strVer)))
      .tap(strVer => fs.writeFile(path.join(pathV, 'latest'), strVer))
      .then(strVer => name => path.join(pathV, strVer, name))
      .then(pathFor => (blob, name) => fs.writeFile(pathFor(name), blob))
      .then(writeBlob => _.mapValues(blobs, writeBlob))
      .props()
      .then(() => version)
      .catch(handleError);
  }

  return {
    getVersion: readLock(getVersion),
    getChildren,
    getBlob: readLock(getBlob),
    update: writeLock(update),
  };
}

module.exports = fsStorage;
