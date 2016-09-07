'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, $ionicHistory, lodash, backupService, walletService, storageService, profileService, platformInfo, gettext, gettextCatalog, $state, $stateParams, popupService) {
    var prevState;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;
    var wallet = profileService.getWallet($stateParams.walletId);

    $scope.init = function() {
      $scope.formData = {};
      $scope.isEncrypted = wallet.isPrivKeyEncrypted();
      $scope.isCordova = platformInfo.isCordova;
      $scope.isSafari = platformInfo.isSafari;
      $scope.formData.noSignEnabled = false;
      $scope.showAdvanced = false;
      $scope.wallet = wallet;
      $scope.canSign = wallet.canSign();

      walletService.getEncodedWalletInfo(wallet, function(err, code) {
        if (err || !code) {
          $log.warn(err);
          return $ionicHistory.goBack();
        }

        if (!code)
          $scope.formData.supported = false;
        else {
          $scope.formData.supported = true;
          $scope.formData.exportWalletInfo = code;
        }

        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };

    /*
      EXPORT WITHOUT PRIVATE KEY - PENDING
    */

    $scope.noSignEnabledChange = function() {
      if (!$scope.supported) return;

      walletService.getEncodedWalletInfo(wallet, function(err, code) {
        if (err) {
          $log.error(err);
          $scope.formData.supported = false;
          $scope.formData.exportWalletInfo = null;
        } else {
          $scope.formData.supported = true;
          $scope.formData.exportWalletInfo = code;
        }
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };

    $scope.downloadWalletBackup = function() {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
          return;
        }
        var opts = {
          noSign: $scope.formData.noSignEnabled,
          addressBook: localAddressBook
        };

        backupService.walletDownload($scope.formData.password, opts, function(err) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
            return;
          }
          $ionicHistory.clearHistory();
          $state.go('tabs.home');
        });
      });
    };

    $scope.getAddressbook = function(cb) {
      storageService.getAddressbook(wallet.credentials.network, function(err, addressBook) {
        if (err) return cb(err);

        var localAddressBook = [];
        try {
          localAddressBook = JSON.parse(addressBook);
        } catch (ex) {
          $log.warn(ex);
        }

        return cb(null, localAddressBook);
      });
    };

    $scope.getBackup = function(cb) {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
          return cb(null);
        }
        var opts = {
          noSign: $scope.formData.noSignEnabled,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport($scope.formData.password, opts);
        if (!ew) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
        }
        return cb(ew);
      });
    };

    $scope.viewWalletBackup = function() {
      $timeout(function() {
        $scope.getBackup(function(backup) {
          var ew = backup;
          if (!ew) return;
          $scope.backupWalletPlainText = ew;
        });
      }, 100);
    };

    $scope.copyWalletBackup = function() {
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;
        window.cordova.plugins.clipboard.copy(ew);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      });
    };

    $scope.sendWalletBackup = function() {
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (wallet.credentials.walletName || wallet.credentials.walletId);
      if (wallet.alias) {
        name = wallet.alias + ' [' + name + ']';
      }
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;

        if ($scope.formData.noSignEnabled)
          name = name + '(No Private Key)';

        var subject = 'Copay Wallet Backup: ' + name;
        var body = 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}';
        window.plugins.socialsharing.shareViaEmail(
          body,
          subject,
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      });
    };

  });
