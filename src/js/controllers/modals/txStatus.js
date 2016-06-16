'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout) {

  if ($scope.cb) $timeout($scope.cb, 100);

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
  };

});
