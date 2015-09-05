'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $rootScope, $location, $timeout, $log, profileService, notification, go, isMobile, isCordova, sjcl, gettext, lodash, ledger) {

    var self = this;

    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.externalIndexValues = lodash.range(0, ledger.MAX_SLOT);
    $scope.externalIndex = 0;
    var reader = new FileReader();

    window.ignoreMobilePause = true;
    $scope.$on('$destroy', function() {
      $timeout(function() {
        window.ignoreMobilePause = false;
      }, 100);
    });

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

      $timeout(function() {
        profileService.importWallet(str2, {
          compressed: null,
          password: null
        }, function(err, walletId) {
          self.loading = false;
          if (err) {
            self.error = err;
          } else {
            $rootScope.$emit('Local/WalletImported', walletId);
            go.walletHome();
            notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          }
        });
      }, 100);
    };


    var _importExtendedPrivateKey = function(xPrivKey) {
      self.loading = true;

      $timeout(function() {
        profileService.importExtendedPrivateKey(xPrivKey, function(err, walletId) {
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
          go.walletHome();
        });
      }, 100);
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          _importBlob(evt.target.result);
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
        _importBlob(backupText);
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

      var passphrase = form.passphrase.$modelValue;
      var words = form.words.$modelValue;
      this.error = null;

      if (!words) {
        this.error = gettext('Please enter the seed words');
      } else if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
        return _importExtendedPrivateKey(words)
      } else {
        var wordList = words.split(/ /).filter(function(v) {
          return v.length > 0;
        });

        // m/ allows to enter a custom derivation 
        if ((wordList.length % 3) != 0 && wordList[0].indexOf('m/') != 0)
          this.error = gettext('Wrong number of seed words:') + wordList.length;
        else
          words = wordList.join(' ');
      }

      if (this.error) {
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }


      opts.passphrase = form.passphrase.$modelValue || null;
      opts.networkName = form.isTestnet.$modelValue ? 'testnet' : 'livenet';

      _importMnemonic(words, opts);
    };

    this.importLedger = function(form) {
      var self = this;
      if (form.$invalid) {
        this.error = gettext('There is an error in the form');
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }
      self.ledger = true;
      ledger.getInfoForNewWallet($scope.externalIndex, function(err, lopts) {
        self.ledger = false;
        if (err) {
          self.error = err;
          $scope.$apply();
          return;
        }
        lopts.externalIndex = $scope.externalIndex;
        lopts.externalSource = 'ledger';
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

  });
