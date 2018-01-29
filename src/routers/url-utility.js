const regexComponentSeg = '[@a-z0-9][._0-9a-z-]*';
const regexComponentName = `${regexComponentSeg}(?:/${regexComponentSeg})*`;
const regexDaoComponentName = `@(?:/${regexComponentSeg})*`;
const regexVersion = '0|[1-9][0-9]*|latest';

function parseVersion(strVer = 0) {
  return strVer === 'latest' ? 0 : parseInt(strVer, 10);
}

function isDaoComponent(component) {
  return component && component.match(new RegExp(regexDaoComponentName));
}

module.exports = {
  regexComponentSeg,
  regexComponentName,
  regexDaoComponentName,
  regexVersion,
  parseVersion,
  isDaoComponent,
};
