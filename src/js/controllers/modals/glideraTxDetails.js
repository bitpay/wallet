'use strict';

angular.module('copayApp.controllers').controller('glideraTxDetailsController', function($scope) {

	var self = $scope.self;

  $scope.cancel = function() {
    $scope.glideraTxDetailsModal.hide();
    $scope.glideraTxDetailsModal.remove();
    $rootScope.modalOpened = false;
  };

});