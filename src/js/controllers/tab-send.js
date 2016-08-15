'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $ionicModal, $log, $timeout, addressbookService, profileService, configService, lodash) {


  var originalList = [];

  $scope.search = '';
  
  $scope.init = function() {

    var wallets = profileService.getWallets();

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        label: v.name,
        isWallet: true,
      });
    });

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      var contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          label: k,
          address: v,
        });
      });

      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);
    });
  };

  $scope.findContact = function() {

    if (!$scope.search || $scope.search.length<2){
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      },10);
      return;
    }

    var result = lodash.filter($scope.list, function(item) {
      var val = item.label || item.alias || item.name;
      return lodash.includes(val.toLowerCase(), $scope.search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.openInputAmountModal = function(recipient) {
    $scope.recipientName = recipient.name || recipient.label;
    $scope.recipientColor = recipient.color;

    $ionicModal.fromTemplateUrl('views/modals/inputAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.inputAmountModal = modal;
      $scope.inputAmountModal.show();
    });
  };
});
