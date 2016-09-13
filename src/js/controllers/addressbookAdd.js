'use strict';

angular.module('copayApp.controllers').controller('addressbookAddController', function($scope, $state, $timeout, addressbookService, popupService) {

  $scope.addressbookEntry = {
    'address': '',
    'name': '',
    'email': ''
  };

  $scope.onQrCodeScanned = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        data = data.replace('bitcoin:', '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.add = function(addressbook) {
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        $state.go('tabs.addressbook');
      });
    }, 100);
  };

});
