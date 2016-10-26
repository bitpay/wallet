'use strict';

angular.module('copayApp.controllers').controller('headController',
  function($scope, $window, $log, glideraService) {
    $scope.appConfig = $window.appConfig;
    $log.info('Running head controller:' + $window.appConfig.nameCase)
  });
