'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $ionicModal, addressbookService, profileService, configService, lodash) {
  var completeList;

  $scope.init = function() {
    addressbookService.list(function(err, ab) {
      if (err) {
        console.log('ERROR:', err);
        return;
      }
      // $scope.contactList = lodash.isEmpty(ab) ? null : ab;
      $scope.contactList = [{
        label: 'Javier',
        address: '123456'
        }, {
        label: 'Javier 2',
        address: '654321'
        }, {
        label: 'Javier 3',
        address: '7891011'
        }, {
        label: 'Javier 4',
        address: '1101987'
      }];
    });

    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    config.aliasFor = config.aliasFor || {};

    // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
    var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
    var ret = lodash.map(credentials, function(c) {
      return {
        m: c.m,
        n: c.n,
        name: config.aliasFor[c.walletId] || c.walletName,
        id: c.walletId,
        color: config.colorFor[c.walletId] || '#4A90E2',
      };
    });

    $scope.wallets = lodash.sortBy(ret, 'name');
    $scope.list = completeList = $scope.contactList.concat($scope.wallets);
  };

  $scope.findContact = function() {
    var result = lodash.filter($scope.list, function(item) {
      var val = item.label || item.alias || item.name;
      return lodash.includes(val.toLowerCase(), $scope.search.toLowerCase());
    });
    if (lodash.isEmpty(result) || lodash.isEmpty($scope.search)) {
      $scope.list = completeList;
      return;
    }
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
