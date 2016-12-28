'use strict';

angular.module('copayApp.services').factory('appConfigService', function($window) {
  return $window.appConfig;
});
