window.daojs = {
  boot: function (info) {
    var paths = {};
    var npmMap = {};

    for (var name in info.versions) {
      var ver = info.versions[name];
      var match = name.match(/^npm\/(.*)$/);

      paths[name] = name + '@' + ver + '/index';
      if (match) {
        npmMap[match[1]] = name;
      }
    }

    requirejs.config({
      baseUrl: window.daojs.base + 'resources',
      paths: paths,
      map: { "npm": npmMap },
    });

    require([info.entry]);
  },
  base: document.currentScript.src.replace(/resources\/@\/bootloader@.*/, ''),
};
