'use strict';

angular.module('copayApp.controllers').controller('UnsupportedController',
  function($scope, $location) {
    if (localStorage && localStorage.length > 0) {
      $location.path('/');
    }
  }
);
