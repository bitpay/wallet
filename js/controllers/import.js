'use strict';

angular.module('copay.import').controller('ImportController',
  function($scope, $rootScope, walletFactory, controllerUtils) {
    $scope.title = 'Import a backup';

    $scope.getFile = function() {
      var reader = new FileReader();

      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var obj = JSON.parse(evt.target.result);
          $rootScope.wallet = walletFactory.fromObj(obj);

          controllerUtils.startNetwork($rootScope.wallet);
        }
      };

      reader.readAsBinaryString($scope.file);
    };
  });
