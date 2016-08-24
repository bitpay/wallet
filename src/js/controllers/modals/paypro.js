'use strict';

angular.module('copayApp.controllers').controller('payproController', function($scope) {
  var self = $scope.self;

  $scope.cancel = function() {
    $scope.payproModal.hide();
  };
});
