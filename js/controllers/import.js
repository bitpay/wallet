'use strict';

angular.module('copayApp.import').controller('ImportController',
  function($scope, $rootScope, walletFactory, controllerUtils, Passphrase) {
    $scope.title = 'Import a backup';
    var reader = new FileReader();
    var _importBackup = function(encryptedObj) {
      Passphrase.getBase64Async($scope.password, function(passphrase){
        var w = walletFactory.fromEncryptedObj(encryptedObj, passphrase);
        if (!w) {
          $scope.loading = false;
          $rootScope.$flashMessage = { message: 'Wrong password', type: 'error'};
          $rootScope.$digest();
          return;
        }
        $rootScope.wallet = w;

        controllerUtils.startNetwork($rootScope.wallet);
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
      if (form.$invalid) {
        $scope.loading = false;
        $rootScope.$flashMessage = { message: 'There is an error in the form. Please, try again', type: 'error'};
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        $scope.loading = false;
        $rootScope.$flashMessage = { message: 'Please, select your backup file or paste the text', type: 'error'};
        $scope.loading = false;
        return;
      }

      $scope.loading = true;
      
      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      }
      else {
        _importBackup(backupText);
      }
    };
  });
