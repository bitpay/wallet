'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, configService, profileService, fingerprintService, walletService) {

    var fc = profileService.focusedClient;
    var config = configService.getSync();
    $scope.deleted = false;

    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
      $scope.deleted = true;
    }

    this.init = function() {
      if (fc) {
        $scope.encryptEnabled = walletService.isEncrypted(fc);
        this.externalSource = fc.getPrivKeyExternalSourceName() == 'ledger' ? "Ledger" : null;
        // TODO externalAccount
        //this.externalIndex = fc.getExternalIndex();
      }

      this.touchidAvailable = fingerprintService.isAvailable();
      $scope.touchidEnabled = config.touchIdFor ? config.touchIdFor[fc.credentials.walletId] : null;
    };

    var handleEncryptedWallet = function(client, cb) {
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    $scope.encryptChange = function() {
      if (!fc) return;
      var val = $scope.encryptEnabled;

      if (val && !walletService.isEncrypted(fc)) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encryptEnabled = false;
            return;
          }
          profileService.setPrivateKeyEncryptionFC(password, function() {
            $rootScope.$emit('Local/NewEncryptionSetting');
            $scope.encryptEnabled = true;
          });
        });
      } else {
        if (!val && walletService.isEncrypted(fc)) {
         handleEncryptedWallet(fc, function(err) {
            if (err) {
              $scope.encryptEnabled = true;
              return;
            }
            profileService.disablePrivateKeyEncryptionFC(function(err) {
              $rootScope.$emit('Local/NewEncryptionSetting');
              if (err) {
                $scope.encryptEnabled = true;
                $log.error(err);
                return;
              }
              $scope.encryptEnabled = false;
            });
          });
        }
      }
    };

    $scope.touchidChange = function() {
      var walletId = fc.credentials.walletId;

      var opts = {
        touchIdFor: {}
      };
      opts.touchIdFor[walletId] = $scope.touchidEnabled;

      fingerprintService.check(fc, function(err) {
        if (err) {
          $log.debug(err);
          $timeout(function() {
            $scope.touchidError = true;
            $scope.touchidEnabled = false;
          }, 100);
          return;
        }
        configService.set(opts, function(err) {
          if (err) {
            $log.debug(err);
            $scope.touchidError = true;
            $scope.touchidEnabled = false;
          }
        });
      });
    };
  });
