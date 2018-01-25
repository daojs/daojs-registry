const regexComponentSeg = '[@a-z0-9][._0-9a-z-]*';
const regexComponentName = `${regexComponentSeg}(?:/${regexComponentSeg})*`;
const regexVersion = '0|[1-9][0-9]*|latest';

function parseVersion(strVer) {
  return strVer === 'latest' ? 0 : parseInt(strVer, 10);
}

module.exports = {
  regexComponentSeg,
  regexComponentName,
  regexVersion,
  parseVersion,
};
