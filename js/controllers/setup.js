'use strict';

angular.module('copay.setup').controller('SetupController',
  function($scope, $rootScope, $location, $timeout, walletFactory, controllerUtils, Passphrase) {

    $rootScope.videoInfo = {};
    $scope.loading = false;
    $scope.walletPassword = $rootScope.walletPassword;

    // ng-repeat defined number of times instead of repeating over array?
    $scope.getNumber = function(num) {
      return new Array(num);   
    }

    $scope.totalCopayers = config.wallet.totalCopayers;
    $scope.TCValues = [];
    for (var n = 1; n <= config.limits.totalCopayers; n++)
      $scope.TCValues.push(n);

    var updateRCSelect = function(n) {
      $scope.requiredCopayers = parseInt(Math.min(n / 2 + 1, config.limits.mPlusN-n));
      $scope.RCValues = [];
      for (var m = 1; m <= n; m++) {
        if (n + m <= config.limits.mPlusN) {
          $scope.RCValues.push(m);
        }
      }
    };

    updateRCSelect($scope.totalCopayers);

    $scope.$watch('totalCopayers', function(tc) {
      updateRCSelect(tc);
    });

    $scope.create = function(form) {
      if (form && form.$invalid) {
        $rootScope.flashMessage = { message: 'Please, enter required fields', type: 'error'};
        return;
      }
      $scope.loading = true;
      Passphrase.getBase64Async($scope.walletPassword, function(passphrase){
        var opts = {
          requiredCopayers: $scope.requiredCopayers,
          totalCopayers: $scope.totalCopayers,
          name: $scope.walletName, 
          nickname: $scope.myNickname,
          passphrase: passphrase,
        };
        var w = walletFactory.create(opts);
        controllerUtils.startNetwork(w);
      });
    };

  });
