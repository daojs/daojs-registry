const express = require('express');
const path = require('path');
const {
  daojs,
  storages: { FSStorage },
  loaders: { babelLoader, cdnLoader },
} = require('..');

const app = express();

app
  .use('/daojs', daojs({
    storage: new FSStorage({
      root: path.join(process.env.HOME || process.env.HOMEPATH, '.daojs'),
    }),
    loaders: {
      babel: babelLoader(),
      cdn: cdnLoader(),
    },
  }))
  .get('/foo', (req, res) => {
    res.send('foo');
  })
  .listen(3001);
