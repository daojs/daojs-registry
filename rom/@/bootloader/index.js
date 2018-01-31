var component=document.currentScript.dataset.component;
var version=document.currentScript.dataset.version;

requirejs.config({
  baseUrl: document.currentScript.src.replace(/\/@\/bootloader.js/, ''),
  urlArgs: 'v=' + version,
  map: {
    '*': {
      css: 'require-css',
    }
  }
});
require([component]);
