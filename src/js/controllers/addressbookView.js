'use strict';

angular.module('copayApp.controllers').controller('addressbookViewController', function($scope, $state, $timeout, $stateParams, lodash, addressbookService, popupService, $ionicHistory) {

  $scope.$on("$ionicView.beforeEnter", function(event, data){
    var address = data.stateParams.address;

    if (!address) {
      $ionicHistory.back();
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
      $timeout(function() {
        $scope.$apply();
      });
    });
  });

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

});
