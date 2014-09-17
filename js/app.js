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
      config[key] = value;
    });
  }
}

var copayApp = window.copayApp = angular.module('copayApp', [
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
