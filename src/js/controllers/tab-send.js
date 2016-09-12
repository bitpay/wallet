'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $log, $timeout, addressbookService, profileService, lodash, $state, walletService, incomingData ) {

  var originalList;

  $scope.init = function() {
    originalList = [];

    var wallets = profileService.getWallets({
      onlyComplete: true
    });

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        label: v.name,
        isWallet: true,
        getAddress: function(cb) {
          walletService.getAddress(v, false, cb);
        },
      });
    });

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      var contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          label: v,
          address: k,
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });

      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);

      $timeout(function() {
        $scope.$apply();
      }, 1);
    });
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.label || item.alias || item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    item.getAddress(function(err, addr) {
      if (err || !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got toAddress:' + addr + ' | ' + item.label);
      return $state.transitionTo('send.amount', {
        toAddress: addr,
        toName: item.label
      })
    });
  };

  $scope.$on('modal.hidden', function() {
    $scope.init();
  });

});
