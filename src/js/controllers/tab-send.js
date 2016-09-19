'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $log, $timeout, addressbookService, profileService, lodash, $state, walletService, incomingData) {

  var originalList;

  $scope.init = function() {
    originalList = [];

    var wallets = profileService.getWallets({
      onlyComplete: true
    });

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        name: v.name,
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
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
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
      var val = item.name;
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
      $log.debug('Got toAddress:' + addr + ' | ' + item.name);
      return $state.transitionTo('tabs.send.amount', {
        toAddress: addr,
        toName: item.name,
        toEmail: item.email
      })
    });
  };

  $scope.$on('modal.hidden', function() {
    $scope.init();
  });

});
