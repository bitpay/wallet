'use strict';

angular.module('copay.setup').controller('SetupController',
  function($scope, $rootScope, $location, Network) {

    $scope.loading = false;

    $scope.selectedWalletId = false;
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
    })

    $scope.create = function(totalCopayers, requiredCopayers) {
      alert(totalCopayers);
      alert(requiredCopayers);
    };

  });
