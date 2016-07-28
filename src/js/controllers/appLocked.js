'use strict';

angular.module('copayApp.controllers').controller('appLockedController', function($scope, $timeout) {

  $scope.restart = function() {
    var hashIndex = window.location.href.indexOf('#/');
    window.location = window.location.href.substr(0, hashIndex);
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };
});
