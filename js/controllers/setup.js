'use strict';

angular.module('copay.setup').controller('SetupController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {

    $scope.loading = false;

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
      $scope.loading = true;
      var opts = {
        requiredCopayers: requiredCopayers,
        totalCopayers: totalCopayers
      };
      var w = walletFactory.create(opts);
      controllerUtils.setupUxHandlers(w);
      w.netStart();
    };

  });
