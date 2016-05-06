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
        $scope.encrypt = walletService.isEncrypted(fc);
        this.externalSource = fc.getPrivKeyExternalSourceName() == 'ledger' ? "Ledger" : null;
        // TODO externalAccount
        //this.externalIndex = fc.getExternalIndex();
      }

      this.touchidAvailable = fingerprintService.isAvailable();
      $scope.touchid = config.touchIdFor ? config.touchIdFor[fc.credentials.walletId] : null;
    };

    var handleEncryptedWallet = function(client, cb) {
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    var unwatchEncrypt = $scope.$watch('encrypt', function(val) {
      var fc = profileService.focusedClient;
      if (!fc) return;

      if (val && !walletService.isEncrypted(fc)) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encrypt = false;
            return;
          }
          profileService.setPrivateKeyEncryptionFC(password, function() {
            $rootScope.$emit('Local/NewEncryptionSetting');
            $scope.encrypt = true;
          });
        });
      } else {
        if (!val && walletService.isEncrypted(fc)) {
         handleEncryptedWallet(fc, function(err) {
            if (err) {
              $scope.encrypt = true;
              return;
            }
            profileService.disablePrivateKeyEncryptionFC(function(err) {
              $rootScope.$emit('Local/NewEncryptionSetting');
              if (err) {
                $scope.encrypt = true;
                $log.error(err);
                return;
              }
              $scope.encrypt = false;
            });
          });
        }
      }
    });

    var unwatchRequestTouchid = $scope.$watch('touchid', function(newVal, oldVal) {
      if (newVal == oldVal || $scope.touchidError) {
        $scope.touchidError = false;
        return;
      }
      var walletId = fc.credentials.walletId;

      var opts = {
        touchIdFor: {}
      };
      opts.touchIdFor[walletId] = newVal;

      fingerprintService.check(fc, function(err) {
        if (err) {
          $log.debug(err);
          $timeout(function() {
            $scope.touchidError = true;
            $scope.touchid = oldVal;
          }, 100);
          return;
        }
        configService.set(opts, function(err) {
          if (err) {
            $log.debug(err);
            $scope.touchidError = true;
            $scope.touchid = oldVal;
          }
        });
      });
    });

    $scope.$on('$destroy', function() {
      unwatchEncrypt();
      unwatchRequestTouchid();
    });
  });
