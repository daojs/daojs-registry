#!/usr/bin/env node
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const axios = require('axios');
const esprima = require('esprima');
const _ = require('lodash');
const chalk = require('chalk');
const path = require('path');

const { argv } = require('yargs')
  .option('path', { alias: 'p', default: './' })
  .option('metadata', { alias: 'm', default: 'daopkg.json' })
  .option('source', { alias: 's', default: 'source.js' })
  .option('sourceMin', { alias: 'sm', default: 'source.min.js' })
  .option('readme', { alias: 'r', default: 'readme.md' })
  .option('verbose', { alias: 'v' });

const isVerbose = argv.verbose;

const log = (...args) => console.log(...args);
log.succ = (...args) => log(chalk.green(...args));
log.error = (...args) => log(chalk.red(...args));
log.verbose = (...args) => isVerbose && log(...args);

const url = 'http://daojs.koreasouth.cloudapp.azure.com';

axios.interceptors.request.use((config) => {
  // Log request info before sent
  log.verbose('Request:', config.method.toUpperCase(), config.url);
  log.verbose('Request payload:', JSON.stringify(config.data));
  return config;
});

Promise.props(_.mapValues({
  metadata: argv.metadata,
  source: argv.source,
  sourceMin: argv.sourceMin,
  readme: argv.readme,
}, (value, key) => {
  const encoding = 'utf8';
  const filePath = path.resolve(argv.path, value);

  log.verbose('Read', key, 'from', filePath, 'with encoding', encoding);
  return fs.readFileAsync(filePath, encoding);
}))
  .then(({
    metadata,
    sourceMin,
    source,
    readme,
  }) => {
    const {
      name = '',
      type = 'es2015',
      description = '',
      dependencies = {},
    } = JSON.parse(metadata);

    return axios.post(`${url}/resources/${name}`, {
      source: {
        data: sourceMin,
      },
      sourceDebug: {
        data: source,
      },
      readme: {
        data: readme,
      },
      type,
      description,
      dependencies: _.chain(esprima.parseModule(source, { jsx: true }).body)
        .filter(syntaxTreeNode => syntaxTreeNode.type === 'ImportDeclaration')
        .reduce((deps, importDeclaration) => {
          const importFrom = importDeclaration.source.value;
          return _.defaults({
            [importFrom]: {
              version: dependencies[importFrom] || 0,
              variable: ((specifiers) => {
                if (_.size(specifiers) === 1 &&
                    _.first(specifiers).type === 'ImportDefaultSpecifier') {
                  return _.first(specifiers).local.name;
                }
                return _.reduce(specifiers, (result, specifier) => _.defaults({
                  [specifier.local.name]: specifier.local.name,
                }, result), {});
              })(importDeclaration.specifiers),
            },
          }, deps);
        }, {})
        .value(),
    });
  })
  .then((response) => {
    log.succ('DONE version =', response.data.version);
    log('View your component at', response.config.url.replace(`${url}/resources/`, `${url}/public/#/detail/`));
  })
  .catch((error) => {
    log.error(error);
    if (error.response) {
      log.error('Response:', _.get(error, 'response.data.message', 'empty'));
    }
  });
