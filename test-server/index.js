const express = require('express');
const path = require('path');
const { daojs, FSStorage } = require('..');

const app = express();

app
  .use('/daojs', daojs({
    storage: new FSStorage({
      root: path.join(process.env.HOME, '.daojs'),
    }),
  }))
  .get('/foo', (req, res) => {
    res.send('foo');
  })
  .listen(3001);
