'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, lodash, addressbookService, popupService, $ionicHistory, platformInfo, gettextCatalog, bitcoreCash) {
  $scope.isChromeApp = platformInfo.isChromeApp;
  $scope.addressbookEntry = {};
  var coin;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.addressbookEntry = {};
    $scope.addressbookEntry.name = data.stateParams.name;
    $scope.addressbookEntry.email = data.stateParams.email;
    $scope.addressbookEntry.address = data.stateParams.address;

    var cashAddress = bitcoreCash.Address.isValid($scope.addressbookEntry.address, 'livenet');
    if (cashAddress) {
      coin = 'bch';
    } else {
      coin = 'btc';
    }
  });

  $scope.sendTo = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.send');
    $timeout(function() {
      $state.transitionTo('tabs.send.amount', {
        toAddress: $scope.addressbookEntry.address,
        toName: $scope.addressbookEntry.name,
        toEmail: $scope.addressbookEntry.email,
        coin: coin
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    var title = gettextCatalog.getString('Warning!');
    var message = gettextCatalog.getString('Are you sure you want to delete this contact?');
    popupService.showConfirm(title, message, null, null, function(res) {
      if (!res) return;
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $ionicHistory.goBack();
      });
    });
  };

});
