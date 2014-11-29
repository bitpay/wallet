'use strict';

angular.module('copayApp.controllers').controller('ImportProfileController',
  function($scope, $rootScope, $location, notification, isMobile, pluginManager, identityService) {
    $scope.title = 'Import a backup';
    $scope.importStatus = 'Importing wallet - Reading backup...';
    $scope.hideAdv = true;
    $scope.is_iOS = isMobile.iOS();

    var reader = new FileReader();

    var updateStatus = function(status) {
      $scope.importStatus = status;
      $scope.$digest();
    }

    var _importBackup = function(str) {
      var password = $scope.password;
      updateStatus('Importing profile - Setting things up...');

      copay.Identity.importFromEncryptedFullJson(str, password, {
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      }, function(err, iden) {
        if (err) {
          $scope.loading = false;

          if ((err.toString() || '').match('BADSTR')) {
            $scope.error = 'Bad password or corrupt profile file';
          } else if ((err.toString() || '').match('EEXISTS')) {
            $scope.error = 'Profile already exists';
          } else {
            $scope.error = 'Unknown error';
          }
          $scope.$digest();

        } else {
          var firstWallet = iden.getLastFocusedWallet();
          root.bind($scope, iden, firstWallet);
        }
      });
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
        $scope.error = 'Please enter the required fields';
        return;
      }
      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        $scope.loading = false;
        $scope.error = 'Please, select your backup file';
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        _importBackup(backupText);
      }
    };
  });
