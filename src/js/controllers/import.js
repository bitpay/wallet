'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $rootScope, $location, $timeout, $log, profileService, configService, notification, go, sjcl, gettext, lodash, ledger, trezor, isChromeApp) {

    var self = this;
    var reader = new FileReader();
    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;
    $scope.accountForSeed = 0;
    self.accountValuesForSeed = lodash.range(0, 100);

    window.ignoreMobilePause = true;
    $scope.$on('$destroy', function() {
      $timeout(function() {
        window.ignoreMobilePause = false;
      }, 100);
    });

    var updateSeedSourceSelect = function() {
      self.seedOptions = [];
      if (!isChromeApp) return;

      self.seedOptions.push({
        id: 'ledger',
        label: gettext('Ledger Hardware Wallet'),
      });

      self.seedOptions.push({
        id: 'trezor',
        label: gettext('Trezor Hardware Wallet'),
      });
      $scope.seedSource = self.seedOptions[0];
    };



    this.setType = function(type) {
      $scope.type = type;
      this.error = null;
      $timeout(function() {
        $rootScope.$apply();
      });
    };

    var _importBlob = function(str, opts) {
      var str2, err;
      try {
        str2 = sjcl.decrypt(self.password, str);
      } catch (e) {
        err = gettext('Could not decrypt file, check your password');
        $log.warn(e);
      };

      if (err) {
        self.error = err;
        $timeout(function() {
          $rootScope.$apply();
        });
        return;
      }

      self.loading = true;
      opts.compressed = null;
      opts.password = null;

      $timeout(function() {
        profileService.importWallet(str2, opts, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
          } else {
            $rootScope.$emit('Local/WalletImported', walletId);
            notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          }
        });
      }, 100);
    };

    var _importExtendedPrivateKey = function(xPrivKey, opts) {
      self.loading = true;

      $timeout(function() {
        profileService.importExtendedPrivateKey(xPrivKey, opts, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
        });
      }, 100);
    };

    var _importMnemonic = function(words, opts) {
      self.loading = true;

      $timeout(function() {
        profileService.importMnemonic(words, opts, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
        });
      }, 100);
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var opts = {};
          opts.bwsurl = $scope.bwsurl;
          _importBlob(evt.target.result, opts);
        }
      }
    };

    this.importBlob = function(form) {
      if (form.$invalid) {
        this.error = gettext('There is an error in the form');

        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        this.error = gettext('Please, select your backup file');
        $timeout(function() {
          $scope.$apply();
        });

        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        var opts = {};
        opts.bwsurl = $scope.bwsurl;
        _importBlob(backupText, opts);
      }
    };

    this.importMnemonic = function(form) {
      if (form.$invalid) {
        this.error = gettext('There is an error in the form');

        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var opts = {};
      if ($scope.bwsurl)
        opts.bwsurl = $scope.bwsurl;

      var passphrase = form.passphrase.$modelValue;
      var words = form.words.$modelValue;
      this.error = null;

      if (!words) {
        this.error = gettext('Please enter the seed words');
      } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
        return _importExtendedPrivateKey(words, opts);
      } else {
        var wordList = words.split(/[\u3000\s]+/);

        if ((wordList.length % 3) != 0)
          this.error = gettext('Wrong number of seed words:') + wordList.length;
      }

      if (this.error) {
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      opts.passphrase = form.passphrase.$modelValue || null;
      opts.networkName = form.isTestnet.$modelValue ? 'testnet' : 'livenet';
      opts.account = $scope.accountForSeed;

      _importMnemonic(words, opts);
    };

    this.importTrezor = function(account, isMultisig) {
      var self = this;
      trezor.getInfoForNewWallet(isMultisig, account, function(err, lopts) {
        self.hwWallet = false;
        if (err) {
          self.error = err;
          $scope.$apply();
          return;
        }

        lopts.externalSource = 'trezor';
        lopts.bwsurl = $scope.bwsurl;
        self.loading = true;
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };

    this.importHW = function(form) {
      if (form.$invalid) {
        this.error = gettext('There is an error in the form');
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var account = $scope.account;
      var isMultisig = form.isMultisig.$modelValue;

      switch (self.seedSourceId) {
        case ('ledger'):
          self.hwWallet = 'Ledger';
          self.importLedger(account);
          break;
        case ('trezor'):
          self.hwWallet = 'Trezor';
          self.importTrezor(account, isMultisig);
          break;
        default:
          throw ('Error: bad source id');
      };
    };

    this.setSeedSource = function() {
      if (!$scope.seedSource) return;
      self.seedSourceId = $scope.seedSource.id;
      self.accountValues = lodash.range(1, 100);

      $timeout(function() {
        $rootScope.$apply();
      });
    };

    this.importLedger = function(account) {
      var self = this;
      ledger.getInfoForNewWallet(true, account, function(err, lopts) {
        self.hwWallet = false;
        if (err) {
          self.error = err;
          $scope.$apply();
          return;
        }

        lopts.externalSource = 'ledger';
        lopts.bwsurl = $scope.bwsurl;
        self.loading = true;
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
        });
      }, 100);
    };

    updateSeedSourceSelect();
    self.setSeedSource('new');
  });
