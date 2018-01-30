#!/usr/bin/env node
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const axios = require('axios');
const esprima = require('esprima');
const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');

const baseUrl = 'http://localhost:3000';
const uploadUrl = `${baseUrl}/components/`;
const detailUrl = `${baseUrl}/public/#/detail/`;

const { argv } = require('yargs')
  .option('path', { alias: 'p', default: './' })
  .option('metadata', { alias: 'm', default: 'metadata.json' })
  .option('source', { alias: 's', default: 'source.js' })
  .option('readme', { alias: 'r', default: 'readme.md' })
  .option('verbose', { alias: 'v' });

const log = (...args) => console.log(...args);
log.succ = (...args) => log(chalk.green(...args));
log.error = (...args) => log(chalk.red(...args));
log.verbose = (...args) => argv.verbose && log(...args);

axios.interceptors.request.use((config) => {
  // Log request info before sent
  log.verbose('Request:', config.method.toUpperCase(), config.url);
  log.verbose('Request payload:', JSON.stringify(config.data));
  return config;
});

const isDirectory = source => fs.lstatAsync(source).then(stat => stat.isDirectory());
const getDirectories = source => fs.readdirAsync(source)
  .map(name => path.join(source, name))
  .filter(isDirectory);

let rootName;

function upload(directory, isRoot = false) {
  let currentName;

  // Recursively upload all sub directories
  const subTasks = getDirectories(directory).map(upload);

  // Upload current directory
  const currentTask = Promise.props(_.mapValues({
    metadata: argv.metadata,
    source: argv.source,
    readme: argv.readme,
  }, (fileName, fileType) => {
    const encoding = 'utf8';
    const filePath = path.resolve(directory, fileName);

    log.verbose('Read', fileType, 'from', filePath, 'with encoding', encoding);
    return fs.readFileAsync(filePath, encoding)
      .catch((error) => {
        if (fileType === 'metadata') {
          return '{}';
        }
        if (fileType === 'readme') {
          return '';
        }
        throw error;
      });
  }))
    .then(({
      metadata,
      source,
      readme,
    }) => {
      const {
        name = '',
        type = 'es2015',
        description = '',
        dependencies = {},
      } = JSON.parse(metadata);
      if (isRoot) {
        if (!name.startsWith('@/')) {
          throw new Error('Component name must starts with @/');
        }
        rootName = name;
        currentName = name;
      } else {
        currentName = `${rootName}/${path.relative(argv.path, directory)}`;
      }

      return axios.post(`${uploadUrl}${currentName}`, {
        source,
        readme,
        type,
        description,
        dependencies: _.chain(esprima.parseModule(source, { jsx: true }).body)
          .filter(syntaxTreeNode => syntaxTreeNode.type === 'ImportDeclaration')
          .reduce((deps, importDeclaration) => {
            const importFrom = importDeclaration.source.value;
            let version = dependencies[importFrom];
            if (_.isEmpty(version)) {
              version = importFrom.startsWith('@/') ? '0' : '*';
            }
            return _.defaults({
              [importFrom]: version,
            }, deps);
          }, {})
          .value(),
      });
    })
    .then((response) => {
      log.succ(`Upload ${currentName} successfully, version = ${response.data.version}`);
      log(`    View your component at ${response.config.url.replace(uploadUrl, detailUrl)}`);
      return { success: 1 };
    })
    .catch((error) => {
      log.error(`Upload ${currentName} failed, ${error}`);
      if (error.response) {
        log(`    message: ${_.get(error, 'response.data.message', 'empty')}`);
      }
      return { failed: 1 };
    });

  return Promise.props({ subTasks, currentTask })
    .then(result => result.subTasks.concat(result.currentTask))
    .reduce((sum, current) => _.defaults({
      success: (current.success || 0) + sum.success,
      failed: (current.failed || 0) + sum.failed,
    }, sum), {
      success: 0,
      failed: 0,
    });
}

upload(argv.path, true).then((result) => {
  log(`Upload finished, taotal: ${result.success + result.failed}, success: ${result.success}, failed: ${result.failed}`);
});
