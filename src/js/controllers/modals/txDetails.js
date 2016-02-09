'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($scope, $rootScope, profileService, configService) {

	var self = $scope.self;
  var fc = profileService.focusedClient;

  $scope.settings = configService.getSync();
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;

  $scope.getAmount = function(amount) {
    return self.getAmount(amount);
  };

  $scope.getUnitName = function() {
    return self.getUnitName();
  };

  $scope.getShortNetworkName = function() {
    var n = fc.credentials.network;
    return n.substring(0, 4);
  };

  $scope.copyAddress = function(addr) {
    if (!addr) return;
    self.copyAddress(addr);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
    $rootScope.modalOpened = false;
  };

});