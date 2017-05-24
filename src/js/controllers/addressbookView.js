'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, $stateParams, lodash, addressbookService, popupService, $ionicHistory, platformInfo) {
  $scope.isChromeApp = platformInfo.isChromeApp;
  $scope.addressbookEntry = {};
  $scope.addressbookEntry.name = $stateParams.name;
  $scope.addressbookEntry.email = $stateParams.email;
  $scope.addressbookEntry.address = $stateParams.address;

  $scope.sendTo = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.send');
    $timeout(function() {
      $state.transitionTo('tabs.send.amount', {
        toAddress: $scope.addressbookEntry.address,
        toName: $scope.addressbookEntry.name,
        toEmail: $scope.addressbookEntry.email
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    addressbookService.remove(addr, function(err, ab) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      $ionicHistory.goBack();
    });
  };

});
