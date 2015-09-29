'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $timeout, lodash, profileService) {

    var fc = profileService.focusedClient;
    var c = fc.credentials;
    var basePath = 'xpub'

    $scope.walletName = c.walletName;
    $scope.walletId = c.walletId;
    $scope.network = c.network;
    $scope.addressType = c.addressType || 'P2SH';
    $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
    $scope.M = c.m;
    $scope.N = c.n;
    $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
    $scope.addrs = null;

    fc.getMainAddresses({
      doNotVerify: true
    }, function(err, addrs) {
      if (err) {
        $log.warn(err);
        return;
      };
      var last10 = [],
        i = 0,
        e = addrs.pop();
      while (i++ < 10 && e) {
        e.path = basePath + e.path.substring(1);
        last10.push(e);
        e = addrs.pop();
      }
      $scope.addrs = last10;
      $timeout(function() {
        $scope.$apply();
      });

    });

    this.sendAddrs = function() {

      function formatDate(ts) {
        var dateObj = new Date(ts * 1000);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError';
        }
        if (!dateObj.toJSON()) {
          return '';
        }
        return dateObj.toJSON();
      };

      fc.getMainAddresses({
        doNotVerify: true
      }, function(err, addrs) {
        if (err) {
          $log.warn(err);
          return;
        };

        var body = 'Copay Wallet' + fc.walletName + ' Addresses\n  Only Main Addresses are  shown.\n\n';
        body += '\n\n';
        body += addrs.map(function(v) {
          return addrs.address, basePath + addrs.path.substring(1), formatDate(addrs.createdOn);
        }).join('\n');

        var properties = {
          subject: 'Copay Addresses',
          body: body,
          isHtml: false
        };
        window.plugin.email.open(properties);
      });
    };
  });
