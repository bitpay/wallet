'use strict';

var modules = [
  'angularMoment',
  'monospaced.qrcode',
  'gettext',
  'ionic',
  'ionic-toast',
  'angular-clipboard',
  'ngLodash',
  'ngCsv',
  'bwcModule',
  'pbkdf2Module',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
  'copayApp.addons'
];

var copayApp = window.copayApp = angular.module('copayApp', modules);

angular.module('copayApp.filters', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
angular.module('copayApp.addons', []);
