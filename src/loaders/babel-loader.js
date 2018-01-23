const _ = require('lodash');
const { transform } = require('babel-core');

function generateNameList(namedExports) {
  if (_.isEmpty(namedExports)) {
    return null;
  }
  const list = _.toPairs(namedExports).map(p => p.join(' as '));
  return `{ ${list.join(', ')} }`;
}

function generateImport(descriptor, component) {
  const { variable } = descriptor;

  if (_.isString(variable)) {
    return generateImport({
      variable: { default: variable },
    }, component);
  }

  if (_.isObject(variable)) {
    const { default: defaultExport } = variable;
    const otherExports = _.omit(variable, 'default');
    const variableStr = _.compact([
      _.isString(defaultExport) && defaultExport,
      generateNameList(otherExports),
    ]).join(', ');

    return `import ${variableStr} from '${component}';`;
  }

  return null;
}


function preprocess({ source, dependencies }) {
  const imports = _.compact(_.map(dependencies, generateImport));
  return imports.concat(source).join('\n');
}

module.exports = function babelBuilder(options = {
  ast: false,
  presets: ['env', 'react'],
  plugins: ['transform-es2015-modules-amd'],
}) {
  return (source, {
    component,
    version,
    metadata: {
      dependencies = {},
    } = {},
    query,
  }) => Promise.resolve({ source, dependencies })
    .then(preprocess)
    .then(src => transform(src, _.defaults({
      sourceFileName: `daojs:///${component}@${version}/source.js`,
      sourceMaps: _.has(query, 'debug') ? 'inline' : false,
    }, options)))
    .then(_.property('code'));
};
