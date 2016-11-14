'use strict';

angular.module('copayApp.controllers').controller('addressesController', function($scope, $stateParams, profileService, walletService) {
  $scope.wallet = profileService.getWallet($stateParams.walletId);

});
