'use strict';

angular.module('copayApp.controllers').controller('ImportController',
  function($scope, $rootScope, $location, controllerUtils, notification, isMobile, Compatibility) {

    $rootScope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;
    $scope.is_iOS = isMobile.iOS();

    Compatibility.check($scope);

    var reader = new FileReader();

    var updateStatus = function(status) {
      $scope.importStatus = status;
      $scope.$digest();
    }

    var _importBackup = function(encryptedObj) {
      var password = $scope.password;
      updateStatus('Importing wallet - Setting things up...');
      var skipFields = [];
      if ($scope.skipPublicKeyRing)
        skipFields.push('publicKeyRing');

      if ($scope.skipTxProposals)
        skipFields.push('txProposals');

      $rootScope.iden.importEncryptedWallet(encryptedObj, password, skipFields, function(err, w) {
        if (!w) {
          $scope.loading = false;
          notification.error('Error', err || 'Wrong password');
          $rootScope.$digest();
          return;
        }

        // if wallet was never used, we're done
        if (!w.isReady()) {
          controllerUtils.installWalletHandlers($scope, w);
          controllerUtils.setFocusedWallet(w);
          return;
        }

        // if it was used, we need to scan for indices
        w.updateIndexes(function(err) {
          updateStatus('Importing wallet - We are almost there...');
          if (err) {
            $scope.loading = false;
            notification.error('Error', 'Error updating indexes: ' + err);
          }
          controllerUtils.installWalletHandlers($scope, w);
          controllerUtils.setFocusedWallet(w);
        });
      });
    };

    $scope.openFileDialog = function() {
      if (window.cshell) {
        return cshell.send('backup:import');
      }
      $scope.choosefile = !$scope.choosefile;
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var encryptedObj = evt.target.result;
          copay.Compatibility.importEncryptedWallet($rootScope.iden, encryptedObj, $scope.password, {},
            function(err, wallet){
              if (err) {
                notification.error('Error', 'Could not read wallet. Please check your password');
              } else {
                controllerUtils.installWalletHandlers($scope, wallet);
                controllerUtils.setFocusedWallet(wallet);
                return;
              }
            }
          );
        }
      };
    };

    $scope.import = function(form) {
      $scope.loading = true;

      if (form.$invalid) {
        $scope.loading = false;
        notification.error('Error', 'There is an error in the form.');
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var backupOldWallet = form.backupOldWallet.$modelValue;
      var password = form.password.$modelValue;

      if (backupOldWallet) {
        backupText = backupOldWallet.value;
      }

      if (!backupFile && !backupText) {
        $scope.loading = false;
        notification.error('Error', 'Please, select your backup file');
        $scope.loading = false;
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      }
      else {
          copay.Compatibility.importEncryptedWallet($rootScope.iden, backupText, $scope.password, {},
            function(err, wallet){
              if (err) {
                notification.error('Error', 'Could not read wallet. Please check your password');
              } else {
                copay.Compatibility.deleteOldWallet(backupOldWallet);
                controllerUtils.installWalletHandlers($scope, wallet);
                controllerUtils.setFocusedWallet(wallet);
                return;
              }
            }
          );
        try {
          _importBackup(backupText);
        } catch(e) {
          copay.Compatibility.importEncryptedWallet(backupText, $scope.password, $scope.skipPublicKeyRing, $scope.skipTxProposals);
        }
      }
    };
  });
