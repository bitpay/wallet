'use strict';

var modules = [
  'ui.router',
  'angularMoment',
  'base64',
  'door3.css',
  'ionic',
  'mm.foundation',
  'monospaced.qrcode',
  'gettext',
  'ngLodash',
  'bwcModule',
  'copayApp.filters',
  'copayApp.model',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
  'copayApp.api',
  'copayApp.plugins'
];

var copayApp = window.copayApp = angular.module('copayApp', modules);

angular.module('copayApp.filters', []);
angular.module('copayApp.model', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
angular.module('copayApp.api', []);
angular.module('copayApp.plugins', []);

