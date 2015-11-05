'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, go, notification, profileService, configService, isCordova, storageService, applicationService, $modal, gettext, lodash, ledger, trezor, isChromeApp, isDevel) {

    var self = this;
    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;
    self.accountValuesForSeed = lodash.range(0, 100);
    $scope.accountForSeed = 0;

    this.onQrCodeScanned = function(data) {
      $scope.secret = data;
      $scope.joinForm.secret.$setViewValue(data);
      $scope.joinForm.secret.$render();
    };


    var updateSeedSourceSelect = function() {
      self.seedOptions = [{
        id: 'new',
        label: gettext('New Random Seed'),
      }, {
        id: 'set',
        label: gettext('Specify Seed...'),
      }];
      $scope.seedSource = self.seedOptions[0];


      if (isChromeApp) {
        self.seedOptions.push({
          id: 'ledger',
          label: gettext('Ledger Hardware Wallet'),
        });
      }

      if (isChromeApp || isDevel) {
        self.seedOptions.push({
          id: 'trezor',
          label: gettext('Trezor Hardware Wallet'),
        });
      }
    };

    this.setSeedSource = function(src) {
      self.seedSourceId = $scope.seedSource.id;
      self.accountValues = lodash.range(1, 100);

      $timeout(function() {
        $rootScope.$apply();
      });
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
        bwsurl: $scope.bwsurl,
        account: $scope.accountForSeed || 0,
      }

      var setSeed = self.seedSourceId =='set';
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

      if (self.seedSourceId == 'ledger' || self.seedSourceId == 'trezor') {
        var account = $scope.account;
        if (!account) {
          this.error = gettext('Please select account');
          return;
        }
        opts.account =  account;
        self.hwWallet = self.seedSourceId == 'ledger' ? 'Ledger' : 'Trezor';
        var src = self.seedSourceId == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(true, account, function(err, lopts) {
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

    updateSeedSourceSelect();
    self.setSeedSource('new');
  });
