'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService, configService, isMobile, isCordova, gettext, isChromeApp, ledger) {

    var self = this;
    var defaults = configService.getDefaults();
    this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
   
    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    // ng-repeat defined number of times instead of repeating over array?
    this.getNumber = function(num) {
      return new Array(num);
    }

    var updateRCSelect = function(n) {
      $scope.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      self.RCValues = lodash.range(1, maxReq + 1);
      $scope.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    this.externalIndexValues = lodash.range(0,ledger.MAX_SLOT);
    $scope.externalIndex = 0;
    this.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);
    $scope.totalCopayers = defaults.wallet.totalCopayers;

    this.setTotalCopayers = function(tc) {
      updateRCSelect(tc);
    };

    this.isChromeApp = function() {
      return isChromeApp;
    };

    this.create = function(form) {
      if (form && form.$invalid) {
        this.error = gettext('Please enter the required fields');
        return;
      }
      var opts = {
        m: $scope.requiredCopayers,
        n: $scope.totalCopayers,
        name: form.walletName.$modelValue,
        myName: $scope.totalCopayers > 1 ? form.myName.$modelValue : null,
        networkName: form.isTestnet.$modelValue ? 'testnet' : 'livenet',
      };
      var setSeed = form.setSeed.$modelValue;
      if  (setSeed) {
        opts.mnemonic = form.privateKey.$modelValue;
        opts.passphrase = form.passphrase.$modelValue;
      } else {
        opts.passphrase = form.createPassphrase.$modelValue;
      }

      if (setSeed && !opts.mnemonic) {
        this.error = gettext('Please enter the wallet seed');
        return;
      }
 
      if (form.hwLedger.$modelValue) {
        self.ledger = true;
        ledger.getInfoForNewWallet($scope.externalIndex, function(err, lopts) {
          self.ledger = false;
          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }
          opts = lodash.assign(lopts, opts);
          self._create(opts);
        });
      } else {
        self._create(opts);
      }
    };

    this._create = function (opts) {
      self.loading = true;
      $timeout(function() {
        profileService.createWallet(opts, function(err, secret, walletId) {
          self.loading = false;
          if (err) {
            if (err == "Error creating wallet" && opts.extendedPublicKey) {
              err = gettext("This xpub index is already used by another wallet. Please select another index.");
            }
            $log.warn(err);
            self.error = err;
            $timeout(function() {
              $rootScope.$apply();
            });
          }
          else {
            if ( ( opts.mnemonic && opts.n==1) || opts.externalSource  ) {
              $rootScope.$emit('Local/WalletImported', walletId);
            } else {
              go.walletHome();
            }
          }
        });
      }, 100);
    }
    
    this.formFocus = function(what) {
      if (!this.isWindowsPhoneApp) return

      if (what && what == 'my-name') {
        this.hideWalletName = true;
        this.hideTabs = true;
      }
      else if (what && what == 'wallet-name'){
        this.hideTabs = true;
      }
      else {
        this.hideWalletName = false;
        this.hideTabs = false;
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };

    $scope.$on("$destroy", function() {
      $rootScope.hideWalletNavigation = false;
    });
  });
