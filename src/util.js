const { error } = require('./error');

const regexComponent = /^(\/[_0-9a-z-][._0-9a-z-]*)+$/;
const regexVersion = /^(0|[1-9][0-9]*|latest)$/;
const regexFile = /^index\.js$/;

function parseResourcePath(path) {
  const [
    component,
    rest = null,
  ] = path.split('@', 2);
  const [
    version = null,
    file = null,
  ] = rest === null ? [] : rest.split('/');

  if (!component.match(regexComponent)) {
    error(400, `Invalid compoent '${component}'`);
  }

  if (!(version === null || version.match(regexVersion))) {
    error(400, `Invalid version '${version}'`);
  }

  if (!(file === null || file.match(regexFile))) {
    error(400, `Invalid file '${file}'`);
  }

  return {
    component: component.replace(/^\//, ''),
    version,
    file,
  };
}

module.exports = {
  parseResourcePath,
};
