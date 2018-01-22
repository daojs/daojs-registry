const regexComponent = /^(\/[_0-9a-z-][._0-9a-z-]*)+$/;
const regexVersion = /^(0|[1-9][0-9]*)$/;
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
    throw new Error(`Invalid compoent '${component}'`);
  }

  if (!(version === null || version.match(regexVersion))) {
    throw new Error(`Invalid version '${version}'`);
  }

  if (!(file === null || file.match(regexFile))) {
    throw new Error(`Invalid file '${file}'`);
  }

  return { component, version, file };
}

module.exports = {
  parseResourcePath,
};
