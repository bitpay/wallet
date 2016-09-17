'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, $stateParams, lodash, addressbookService, popupService) {

  var address = $stateParams.address;

  if (!address) {
    $state.go('tabs.addressbook');
    return;
  }

  addressbookService.get(address, function(err, obj) {
    if (err) {
      popupService.showAlert(err);
      return;
    }
    if (!lodash.isObject(obj)) {
      var name = obj;
      obj = {
        'name': name,
        'address': address,
        'email': ''
      };
    }
    $scope.addressbookEntry = obj;
  });

  $scope.sendTo = function() {
    $state.go('^.^.send');
    $timeout(function() {
      $state.go('.amount', {
        toAddress: $scope.addressbookEntry.address,
        toName: $scope.addressbookEntry.name,
        toEmail: $scope.addressbookEntry.email
      });
    }, 100);
  };

});
