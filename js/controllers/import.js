'use strict';

angular.module('copayApp.controllers').controller('ImportController',
  function($scope, $rootScope, $location, controllerUtils, Passphrase, notification, isMobile) {

    $scope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;
    $scope.is_iOS = isMobile.iOS();

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

      $rootScope.iden.importWallet(encryptedObj, password, skipFields, function(err, w) {
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
          _importBackup(encryptedObj);
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
      var password = form.password.$modelValue;

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
        _importBackup(backupText);
      }
    };
  });
