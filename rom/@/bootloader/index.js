window.daojs = {
  boot: function (info) {
    var paths = {};
    var npmMap = {};

    for (var name in info.versions) {
      var ver = info.versions[name];
      paths[name] = name + '.js';
    }

    requirejs.config({
      baseUrl: window.daojs.base + 'scripts',
      paths: paths,
    });

    require([info.entry]);
  },
  base: document.currentScript.src.replace(/scripts\/@\/bootloader@.*/, ''),
};
