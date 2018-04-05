const _ = require('lodash');
const { transform } = require('babel-core');

module.exports = function babelLoader(options = {
  ast: false,
  presets: ['env', 'react'],
  plugins: [
    'transform-es2015-modules-amd',
    'transform-class-properties',
    'transform-object-rest-spread',
  ],
}) {
  return (code, {
    component,
    version,
    debug,
  }) => Promise
    .resolve(transform(code, _.defaults({
      sourceFileName: `daojs:///${component}@${version}/code.js`,
      sourceMaps: debug ? 'inline' : false,
    }, options)))
    .then(_.property('code'));
};
