(function() {
  var component=document.currentScript.dataset.component;
  var version=document.currentScript.dataset.version;
  
  var notAMD = [
    'element-resize-event',
  ];

  var paths = {
    antd: 'https://cdnjs.cloudflare.com/ajax/libs/antd/3.1.6/antd.min',
    'antd/dist/antd.css': 'https://cdnjs.cloudflare.com/ajax/libs/antd/3.4.3/antd.css',
    echarts: 'https://cdnjs.cloudflare.com/ajax/libs/echarts/4.0.4/echarts.min',
    'element-resize-event': 'https://cdn.jsdelivr.net/npm/element-resize-event@2.0.9/index.min',
    lodash: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.5/lodash.min',
    moment: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.20.1/moment.min',
    'prop-types': 'https://cdnjs.cloudflare.com/ajax/libs/prop-types/15.6.1/prop-types.min',
    react: 'https://cdnjs.cloudflare.com/ajax/libs/react/16.2.0/umd/react.production.min',
    'react-dom': 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.2.0/umd/react-dom.production.min',
  };

  requirejs.config({
    baseUrl: document.currentScript.src.replace(/\/@\/bootloader.js/, ''),
    urlArgs: 'v=' + version,
    waitSeconds: 30,
    map: {
      '*': {
        css: 'require-css',
      }
    },
    paths: paths,
    cajon: {
      useXhr: function (url, protocal, hostname, port) {
        return notAMD.reduce(function (memo, current) {
          return memo || (url.indexOf(paths[current]) > -1);
        }, false);
      },
    }
  });

  require([component]);
})();
