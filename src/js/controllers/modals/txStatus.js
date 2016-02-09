'use strict';

angular.module('copayApp.controllers').controller('payproController', function($scope, profileService) {

  if ($scope.cb) $timeout($scope.cb, 100);

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
  };

});