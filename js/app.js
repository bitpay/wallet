'use strict';

var config = defaultConfig;
var localConfig = JSON.parse(localStorage.getItem('config'));

if (localConfig) {
  var count = 0;
  for (name in localConfig) {
    if (localConfig.hasOwnProperty(name)) {
      config[name] = localConfig[name];
    }
  }
}

var log = function() {
  if (config.verbose) console.log(arguments);
}

// From the bundle
var copay = require('copay');

var copayApp = window.copayApp = angular.module('copayApp',[
  'ngRoute',
  'angularMoment',
  'mm.foundation',
  'monospaced.qrcode',
  'notifications',
  'copayApp.filters',
  'copayApp.header',
  'copayApp.footer',
  'copayApp.addresses',
  'copayApp.transactions',
  'copayApp.send',
  'copayApp.backup',
  'copayApp.walletFactory',
  'copayApp.signin',
  'copayApp.socket',
  'copayApp.controllerUtils',
  'copayApp.setup',
  'copayApp.directives',
  'copayApp.video',
  'copayApp.import',
  'copayApp.passphrase',
  'copayApp.settings'
]);

angular.module('copayApp.header', []);
angular.module('copayApp.footer', []);
angular.module('copayApp.addresses', []);
angular.module('copayApp.transactions', []);
angular.module('copayApp.send', []);
angular.module('copayApp.backup', []);
angular.module('copayApp.walletFactory', []);
angular.module('copayApp.controllerUtils', []);
angular.module('copayApp.signin', []);
angular.module('copayApp.setup', []);
angular.module('copayApp.socket', []);
angular.module('copayApp.directives', []);
angular.module('copayApp.video', []);
angular.module('copayApp.import', []);
angular.module('copayApp.passphrase', []);
angular.module('copayApp.settings', []);
