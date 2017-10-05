'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($scope, $timeout, $log, $ionicHistory, $ionicScrollDelegate, backupService, walletService, storageService, profileService, platformInfo, gettextCatalog, $state, $stateParams, popupService, appConfigService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $scope.resizeView();
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 10);
    };

    $scope.checkPassword = function(pw1, pw2) {
      if (pw1.length > 0) {
        if (pw2.length > 0) {
          if (pw1 == pw2) $scope.result = 'correct';
          else $scope.result = 'incorrect';
        } else
          $scope.result = null;
      } else
        $scope.result = null;
    };

    function getPassword(cb) {
      if ($scope.password) return cb(null, $scope.password);

      walletService.prepare(wallet, function(err, password) {
        if (err) return cb(err);
        $scope.password = password;
        return cb(null, password);
      });
    };

    $scope.generateQrCode = function() {
      if ($scope.formData.exportWalletInfo || !walletService.isEncrypted(wallet)) {
        $scope.file.value = false;
      }

      getPassword(function(err, password) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        walletService.getEncodedWalletInfo(wallet, password, function(err, code) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          if (!code)
            $scope.formData.supported = false;
          else {
            $scope.formData.supported = true;
            $scope.formData.exportWalletInfo = code;
          }

          $scope.file.value = false;
          $timeout(function() {
            $scope.$apply();
          });
        });
      });
    };

    var init = function() {
      $scope.formData = {};
      $scope.formData.password = $scope.formData.repeatpassword = '';
      $scope.isEncrypted = wallet.isPrivKeyEncrypted();
      $scope.isCordova = platformInfo.isCordova;
      $scope.isSafari = platformInfo.isSafari;
      $scope.formData.noSignEnabled = false;
      $scope.showAdvanced = false;
      $scope.wallet = wallet;
      $scope.canSign = wallet.canSign();
    };

    /*
      EXPORT WITHOUT PRIVATE KEY - PENDING
    */

    $scope.noSignEnabledChange = function() {
      if (!$scope.formData.supported) return;

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
      getPassword(function(err, password) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        $scope.getAddressbook(function(err, localAddressBook) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
            return;
          }
          var opts = {
            noSign: $scope.formData.noSignEnabled,
            addressBook: localAddressBook,
            password: password
          };

          backupService.walletDownload($scope.formData.password, opts, function(err) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
              return;
            }
            $ionicHistory.removeBackView();
            $state.go('tabs.home');
          });
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
      getPassword(function(err, password) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        $scope.getAddressbook(function(err, localAddressBook) {
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
            return cb(null);
          }
          var opts = {
            noSign: $scope.formData.noSignEnabled,
            addressBook: localAddressBook,
            password: password
          };

          var ew = backupService.walletExport($scope.formData.password, opts);
          if (!ew) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Failed to export'));
          }
          return cb(ew);
        });
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

        var subject = appConfigService.nameCase + ' Wallet Backup: ' + name;
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

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      init();
      $scope.file = {
        value: true
      };
      $scope.formData.exportWalletInfo = null;
      $scope.password = null;
      $scope.result = null;
    });

  });
