const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

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

function getCdnjsUrl({ component, version = 'latest', debug }) {
  const yamlFile = path.join(__dirname, `../../rom/npm/${component}.yaml`);
  if (!fs.existsSync(yamlFile)) {
    return undefined;
  }
  const doc = yaml.safeLoad(fs.readFileSync(yamlFile, 'utf8'));
  return _.get(doc, `${version}.${debug ? 'debug' : 'source'}`);
}

function getCdnCssUrl({ component, version = 'latest', debug }) {
  const paths = component.split('/');
  const yamlFile = path.join(__dirname, `../../rom/npm/${paths[0]}.yaml`);
  if (!fs.existsSync(yamlFile)) {
    return undefined;
  }
  paths.shift();
  const doc = yaml.safeLoad(fs.readFileSync(yamlFile, 'utf8'));
  const keyPath = paths.length > 0 ? `.${paths.join('.')}` : '';
  return _.get(doc, `${version}.css${keyPath}.${debug ? 'debug' : 'source'}`);
}

module.exports = {
  regexComponentSeg,
  regexComponentName,
  regexDaoComponentName,
  regexVersion,
  parseVersion,
  isDaoComponent,
  getCdnjsUrl,
  getCdnCssUrl,
};
