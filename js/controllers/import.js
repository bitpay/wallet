'use strict';

angular.module('copayApp.controllers').controller('ImportController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase, notification) {
    controllerUtils.redirIfLogged();

    $scope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;

    var reader = new FileReader();

    var updateStatus = function(status) {
      $scope.importStatus = status;
      $scope.$digest();
    }

    var _importBackup = function(encryptedObj) {
      Passphrase.getBase64Async($scope.password, function(passphrase) {
        updateStatus('Importing wallet - Setting things up...');
        var w, errMsg;

        var skipFields = [];
        if ($scope.skipPublicKeyRing)
          skipFields.push('publicKeyRing');

        if ($scope.skipTxProposals)
          skipFields.push('txProposals');

        // try to import encrypted wallet with passphrase
        try {
          w = walletFactory.import(encryptedObj, passphrase, skipFields);
        } catch (e) {
          errMsg = e.message;
        }

        if (!w) {
          $scope.loading = false;
          notification.error('Error', errMsg || 'Wrong password');
          $rootScope.$digest();
          return;
        }

        // if wallet was never used, we're done
        if (!w.isReady()) {
          $rootScope.wallet = w;
          controllerUtils.startNetwork($rootScope.wallet, $scope);
          return;
        }

        // if it was used, we need to scan for indices
        w.updateIndexes(function(err) {
          updateStatus('Importing wallet - We are almost there...');
          if (err) {
            $scope.loading = false;
            notification.error('Error', 'Error updating indexes: ' + err);
          }
          $rootScope.wallet = w;
          controllerUtils.startNetwork($rootScope.wallet, $scope);
        });

      });
    };

    $scope.openFileDialog = function() {
      if (window.cshell) {
        return cshell.send('backup:import');
      }
      $scope.choosefile = !$scope.choosefile;
    };

    $scope.openPasteArea = function() {
      $scope.pastetext = !$scope.pastetext;
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
      var password = form.password.$modelValue;

      if (!backupFile) {
        $scope.loading = false;
        notification.error('Error', 'Please, select your backup file or paste the file contents');
        $scope.loading = false;
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      }
    };
  });
