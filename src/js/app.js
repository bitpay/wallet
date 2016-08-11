'use strict';

var modules = [
  'ui.router',
  'angularMoment',
  'monospaced.qrcode',
  'gettext',
  'ionic',
  'ngLodash',
  'ngSanitize',
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
