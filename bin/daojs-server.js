#!/usr/bin/env node
const express = require('express');
const path = require('path');
const _ = require('lodash');
const cors = require('cors');
const {
  daojs,
  storages: { fsStorage, romStorage, waterfallStorage },
  loaders: { babelLoader, jsonLoader },
  urlUtility,
} = require('..');

const view = require('./routers/view');

const { argv } = require('yargs')
  .option('port', { alias: 'p', default: 3000 })
  .option('storage', { alias: 's', default: process.env.HOME || process.env.HOMEPATH })
  .option('daobase', { alias: 'b', default: '/' })
  .option('webbase', { alias: 'w', default: '/public' })
  .option('webfold', { alias: 'wf', default: 'public' });

express()
  .set('view engine', 'pug')
  .set('views', path.join(__dirname, 'views'))
  .use('/view', view({
    urlUtility,
    daobase: argv.daobase,
  }))
  .use(cors())
  .use(argv.webbase, express.static(path.join(__dirname, argv.webfold)))
  .use(argv.daobase, daojs({
    storage: waterfallStorage({
      storages: [{
        condition: node => _.includes(['@/bootloader', '@/requirejs', '@/cajon'], node),
        storage: romStorage({
          root: path.resolve(__dirname, '../rom'),
        }),
      }, {
        storage: fsStorage({
          root: path.join(argv.storage, '.daojs'),
        }),
      }],
    }),
    loaders: {
      js: _.identity,
      json: jsonLoader(),
      es2015: babelLoader(),
    },
  }))
  .listen(argv.port);
