'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $timeout, platformInfo, gettextCatalog, lodash, profileService, configService, go) {
    var base = 'xpub';
    var fc = profileService.focusedClient;
    var c = fc.credentials;
    var walletId = c.walletId;
    var config = configService.getSync();
    var b = 1;
    var isCordova = platformInfo.isCordova;
    config.colorFor = config.colorFor || {};

    $scope.init = function() {
      var basePath = c.getBaseAddressDerivationPath();

      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.network = c.network;
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
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
          e.path = base + e.path.substring(1);
          last10.push(e);
          e = addrs.pop();
        }
        $scope.addrs = last10;
        $timeout(function() {
          $scope.$apply();
        });

      });
    };

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
        fc.getMainAddresses({
          doNotVerify: true
        }, function(err, addrs) {
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
          }, 1000);
        });
      }, 100);
    };

    $scope.saveBlack = function() {
      function save(color) {
        var opts = {
          colorFor: {}
        };
        opts.colorFor[walletId] = color;

        configService.set(opts, function(err) {
          go.walletHome();
          if (err) $log.warn(err);
          $scope.$emit('Local/ColorUpdated');
        });
      };

      if (b != 5) return b++;
      save('#202020');
    };

    $scope.copyToClipboard = function(data) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(data);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

  });
