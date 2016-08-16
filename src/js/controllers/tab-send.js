'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $ionicModal, $log, $timeout, addressbookService, profileService, configService, lodash, $state, walletService) {


  var originalList = [];

  $scope.search = '';

  $scope.init = function() {

    var wallets = profileService.getWallets({onlyComplete: true});

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        label: v.name,
        isWallet: true,
        getAddress: function(cb) {
          console.log('[tab-send.js.20]  get ADDRESS at wallet!!!', v.name); //TODO
          walletService.getAddress(v, false, cb);
        },
      });
    });

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      var contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          label: k,
          getAddress: function(cb) {
            return cb(null,v);
          },
        });
      });

      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);
    });
  };

  $scope.findContact = function() {

    if (!$scope.search || $scope.search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter($scope.list, function(item) {
      var val = item.label || item.alias || item.name;
      return lodash.includes(val.toLowerCase(), $scope.search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    item.getAddress(function(err,addr){
      if (err|| !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got toAddress:' +  addr + ' | ' + item.label)
      return $state.transitionTo('amount', { toAddress: addr, toName: item.label})
    });
  };
});
