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

var copay = require('copay');

var copayApp = window.copayApp = angular.module('copay',[
  'ngRoute',
  'angularMoment',
  'mm.foundation',
  'monospaced.qrcode',
  'notifications',
  'copay.filters',
  'copay.header',
  'copay.footer',
  'copay.addresses',
  'copay.transactions',
  'copay.send',
  'copay.backup',
  'copay.walletFactory',
  'copay.signin',
  'copay.socket',
  'copay.controllerUtils',
  'copay.setup',
  'copay.directives',
  'copay.video',
  'copay.import',
  'copay.passphrase',
  'copay.settings'
]);

angular.module('copay.header', []);
angular.module('copay.footer', []);
angular.module('copay.addresses', []);
angular.module('copay.transactions', []);
angular.module('copay.send', []);
angular.module('copay.backup', []);
angular.module('copay.walletFactory', []);
angular.module('copay.controllerUtils', []);
angular.module('copay.signin', []);
angular.module('copay.setup', []);
angular.module('copay.socket', []);
angular.module('copay.directives', []);
angular.module('copay.video', []);
angular.module('copay.import', []);
angular.module('copay.passphrase', []);
angular.module('copay.settings', []);
