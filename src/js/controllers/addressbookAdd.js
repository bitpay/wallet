'use strict';

angular.module('copayApp.controllers').controller('addressbookAddController', function($scope, $state, $stateParams, $timeout, $ionicHistory, gettextCatalog, addressbookService, popupService, networkService) {

  $scope.fromSendTab = $stateParams.fromSendTab;
  $scope.networkOptions = networkService.getLiveNetworks();

  $scope.addressbookEntry = {
    'networkURI': '',
    'address': $stateParams.addressbookEntry || '',
    'name': '',
    'email': ''
  };

  $scope.onQrCodeScannedAddressBook = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        // Remove protocol if present
        data = data.replace(/^.*:/, '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.add = function(addressbook) {
    // Convert network to a URI
    addressbook.networkURI = addressbook.network.getURI();
    delete addressbook.network;

    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        if ($scope.fromSendTab) $scope.goHome();
        else $ionicHistory.goBack();
      });
    }, 100);
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };

});
