#!/usr/bin/env node
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const axios = require('axios');
const esprima = require('esprima');
const _ = require('lodash');
const chalk = require('chalk');

const { argv } = require('yargs')
  .option('metadata', { alias: 'm', default: 'daopkg.json' })
  .option('source', { alias: 'sm', default: 'source.min.js' })
  .option('sourceDebug', { alias: 's', default: 'source.js' })
  .option('readme', { alias: 'r', default: 'readme.md' });

const url = 'http://daojs.koreasouth.cloudapp.azure.com/resources/';

Promise.map([argv.metadata, argv.source, argv.sourceDebug, argv.readme], path =>
  fs.readFileAsync(path, 'utf8'))
  .then((files) => {
    const {
      name,
      type,
      description,
      dependencies,
    } = JSON.parse(files[0]);

    return axios.post(`${url}${name}`, {
      source: {
        data: files[1],
      },
      sourceDebug: {
        data: files[2],
      },
      readme: {
        data: files[3],
      },
      type,
      description,
      dependencies: _.chain(esprima.parseModule(files[2], { jsx: true }).body)
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
    console.log(chalk.green('SUCCES'), 'version =', response.data.version);
  })
  .catch((error) => {
    console.log(chalk.red('FAILED'), error);
  });
