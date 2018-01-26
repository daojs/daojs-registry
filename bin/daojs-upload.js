/* eslint-disable */
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const axios = require('axios');

const { argv } = require('yargs')
  .option('name', { alias: 'n', default: '' })
  .option('type', { alias: 't', default: 'es2015' })
  .option('desc', { alias: 'd', default: '' })
  .option('source', { alias: 'sm', default: 'source.min.js' })
  .option('sourceDebug', { alias: 's', default: 'source.js' })
  .option('readme', { alias: 'r', default: 'readme.md' });

const url = 'http://daojs.koreasouth.cloudapp.azure.com/resources/';

Promise.map([argv.source, argv.sourceDebug, argv.readme], path => fs.readFileAsync(path))
  .then(files => axios.post(`${url}${argv.name}`, {
    source: {
      data: files[0],
    },
    sourceDebug: {
      data: files[1],
    },
    readme: {
      data: files[2],
    },
    type: argv.type,
  }))
  .then(response => {
    console.log(response);
  })
  .catch(error => {
    console.log(error);
  });
