'use strict';

var copay = require('copay');
var _ = require('underscore');
var config = defaultConfig;
var localConfig = JSON.parse(localStorage.getItem('config'));

if (localConfig) {
  var cmv = copay.version.split('.')[1];
  var lmv = localConfig.version ? localConfig.version.split('.')[1] : '-1';
  if (cmv === lmv) {
    _.each(localConfig, function(value, key) {
      if (key === 'networkName' && config['forceNetwork']) {
        return;
      }
      config[key] = value;
    });
  }
}

var log = function() {
  if (config.verbose) console.log(arguments);
}

var modules = [
  'ngRoute',
  'angularMoment',
  'mm.foundation',
  'monospaced.qrcode',
  'ngIdle',
  'gettext',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
];

if (Object.keys(config.plugins).length)
  modules.push('angularLoad');


var copayApp = window.copayApp = angular.module('copayApp', modules);

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
