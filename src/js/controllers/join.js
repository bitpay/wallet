'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, go, notification, profileService, configService, isCordova, storageService, applicationService, $modal, gettext, lodash, ledger, trezor) {

    var self = this;
    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;

    this.onQrCodeScanned = function(data) {
      $scope.secret = data;
      $scope.joinForm.secret.$setViewValue(data);
      $scope.joinForm.secret.$render();
    };

    this.join = function(form) {
      if (form && form.$invalid) {
        self.error = gettext('Please enter the required fields');
        return;
      }
      self.loading = true;

      var opts = {
        secret: form.secret.$modelValue,
        myName: form.myName.$modelValue,
        bwsurl: $scope.bwsurl
      }

      var setSeed = form.setSeed.$modelValue;
      if (setSeed) {
        var words = form.privateKey.$modelValue;
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = form.passphrase.$modelValue;
      } else {
        opts.passphrase = form.createPassphrase.$modelValue;
      }

      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        this.error = gettext('Please enter the wallet seed');
        return;
      }

      if (form.hwLedger.$modelValue || form.hwTrezor.$modelValue) {
        self.hwWallet = form.hwLedger.$modelValue ? 'Ledger' : 'TREZOR';
        var src = form.hwLedger.$modelValue ? ledger : trezor;

        var account = 0;
        src.getInfoForNewWallet(account, function(err, lopts) {
          self.hwWallet = false;
          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }
          opts = lodash.assign(lopts, opts);
          self._join(opts);
        });
      } else {
        self._join(opts);
      }
    };

    this._join = function(opts) {
      $timeout(function() {
        profileService.joinWallet(opts, function(err) {
          if (err) {
            self.loading = false;
            self.error = err;
            $rootScope.$apply();
            return;
          }

          $timeout(function() {
            var fc = profileService.focusedClient;
            if (fc.isComplete() && (opts.mnemonic || opts.externalSource || opts.extendedPrivateKey))
              $rootScope.$emit('Local/WalletImported', fc.credentials.walletId);
          }, 2000);
        });
      }, 100);
    };
  });
