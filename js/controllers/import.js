'use strict';

angular.module('copay.import').controller('ImportController',
  function($scope, $rootScope, walletFactory, controllerUtils, Passphrase) {
    $scope.title = 'Import a backup';

    $scope.getFile = function() {
      var reader = new FileReader();

      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var encryptedObj = evt.target.result;
          var passphrase = Passphrase.getBase64($scope.password);
          $rootScope.wallet = walletFactory.fromEncryptedObj(encryptedObj, passphrase);
          controllerUtils.startNetwork($rootScope.wallet);
        }
      };

      $scope.import = function() {
        if ($scope.password != '') {
          reader.readAsBinaryString($scope.file);
        }
      };

    };
  });
