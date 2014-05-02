'use strict';

angular.module('copay.import').controller('ImportController',
  function($scope, $rootScope, walletFactory, controllerUtils, Passphrase) {
    $scope.title = 'Import a backup';

    var reader = new FileReader();
    var _importBackup = function(encryptedObj) {
      var passphrase = Passphrase.getBase64($scope.password);
      $rootScope.wallet = walletFactory.fromEncryptedObj(encryptedObj, passphrase);
      controllerUtils.startNetwork($rootScope.wallet);
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

    $scope.import = function() {
      if ($scope.password) {
        if ($scope.backupText) {
          _importBackup($scope.backupText);
        } else {
          reader.readAsBinaryString($scope.file);
        }
      }
    };
  });
