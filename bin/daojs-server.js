#!/usr/bin/env node
const express = require('express');
const path = require('path');
const {
  daojs,
  storages: { FSStorage },
  loaders: { babelLoader, cdnLoader },
} = require('..');

const { argv } = require('yargs')
  .option('port', { alias: 'p', default: 3000 })
  .option('storage', { alias: 's', default: process.env.HOME || process.env.HOMEPATH })
  .option('daobase', { alias: 'b', default: '/' })
  .option('webbase', { alias: 'w', default: '/public' })
  .option('webfold', { alias: 'wf', default: 'public' });

express()
  .use(argv.webbase, express.static(path.join(__dirname, argv.webfold)))
  .use(argv.daobase, daojs({
    storage: new FSStorage({
      root: path.join(argv.storage, '.daojs'),
    }),
    loaders: {
      babel: babelLoader(),
      cdn: cdnLoader(),
    },
  }))
  .listen(argv.port);
