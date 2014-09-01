'use strict';

var copay = require('copay');
var config = defaultConfig;
var localConfig = JSON.parse(localStorage.getItem('config'));
if (localConfig) {
  var cmv = copay.version.split('.')[1];
  var lmv = localConfig.version ? localConfig.version.split('.')[1] : '-1';
  if (cmv === lmv) {
    for (name in localConfig) {
      if (localConfig.hasOwnProperty(name)) {
        if (name === 'networkName' && config['forceNetwork']) {
          continue;
        }
        config[name] = localConfig[name];
      }
    }
  }
}

var copayApp = window.copayApp = angular.module('copayApp', [
  'ngRoute',
  'angularMoment',
  'mm.foundation',
  'monospaced.qrcode',
  'ngIdle',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
]);

copayApp.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'mailto:**'
  ]);
});


angular.module('copayApp.filters', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
