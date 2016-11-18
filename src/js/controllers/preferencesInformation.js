'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $timeout, $ionicHistory, platformInfo, lodash, profileService, configService, $stateParams, walletService, $state) {
    var base = 'xpub';
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.id;
    var config = configService.getSync();
    var b = 1;
    $scope.isCordova = platformInfo.isCordova;
    config.colorFor = config.colorFor || {};

    $scope.sendAddrs = function() {
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

      $timeout(function() {
        walletService.getMainAddresses(wallet, {}, function(err, addrs) {
          if (err) {
            $log.warn(err);
            return;
          };

          var body = 'Copay Wallet "' + $scope.walletName + '" Addresses\n  Only Main Addresses are  shown.\n\n';
          body += "\n";
          body += addrs.map(function(v) {
            return ('* ' + v.address + ' ' + base + v.path.substring(1) + ' ' + formatDate(v.createdOn));
          }).join("\n");

          window.plugins.socialsharing.shareViaEmail(
            body,
            'Copay Addresses',
            null, // TO: must be null or an array
            null, // CC: must be null or an array
            null, // BCC: must be null or an array
            null, // FILES: can be null, a string, or an array
            function() {},
            function() {}
          );

          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    };

    $scope.saveBlack = function() {
      function save(color) {
        var opts = {
          colorFor: {}
        };
        opts.colorFor[walletId] = color;

        configService.set(opts, function(err) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          if (err) $log.warn(err);
        });
      };

      if (b != 5) return b++;
      save('#202020');
    };

    $scope.scan = function() {
      walletService.startScan(wallet);
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      var c = wallet.credentials;
      var basePath = c.getBaseAddressDerivationPath();

      $scope.wallet = wallet;
      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.network = c.network;
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
      $scope.M = c.m;
      $scope.N = c.n;
      $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
    });
  });
