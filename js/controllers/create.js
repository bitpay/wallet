'use strict';


var valid_pairs = {
  '1,1': 112,
  '1,2': 147,
  '2,2': 220,
  '1,3': 182,
  '2,3': 256,
  '3,3': 329,
  '1,4': 216,
  '2,4': 290,
  '3,4': 363,
  '4,4': 436,
  '1,5': 250,
  '2,5': 324,
  '3,5': 398,
  '4,5': 470,
  '1,6': 284,
  '2,6': 358,
  '3,6': 432,
  '1,7': 318,
  '2,7': 392,
  '3,7': 465,
  '1,8': 353,
  '2,8': 427,
  '1,9': 387,
  '2,9': 461,
  '1,10': 421,
  '2,10': 495,
  '1,11': 455,
  '1,12': 489
};

angular.module('copayApp.controllers').controller('CreateController',
  function($scope, $rootScope, $location, $timeout, controllerUtils, backupService, notification) {

    $rootScope.fromSetup = true;
    $scope.loading = false;
    $scope.walletPassword = $rootScope.walletPassword;
    $scope.isMobile = !!window.cordova;
    $scope.hideAdv = true;
    $scope.networkName = config.networkName;

    // ng-repeat defined number of times instead of repeating over array?
    $scope.getNumber = function(num) {
      return new Array(num);
    }

    $scope.totalCopayers = config.wallet.totalCopayers;
    $scope.TCValues = [];
    for (var n = 1; n <= config.limits.totalCopayers; n++)
      $scope.TCValues.push(n);

    var updateRCSelect = function(n) {
      $scope.requiredCopayers = (valid_pairs[[parseInt(n / 2 + 1), n]] > 0 || config.networkName === 'testnet') ?
        parseInt(n / 2 + 1) : 1;
      $scope.RCValues = [];
      for (var m = 1; m <= n; m++) {
        if (valid_pairs[[m, n]] > 0 || config.networkName === 'testnet') {
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
        notification.error('Error', 'Please enter the required fields');
        return;
      }
      $scope.loading = true;
      var opts = {
        requiredCopayers: $scope.requiredCopayers,
        totalCopayers: $scope.totalCopayers,
        name: $scope.walletName,
        privateKeyHex: $scope.private,
        networkName: $scope.networkName,
      };
      $rootScope.iden.createWallet(opts, function(err, w) {
        $scope.loading = false;
        controllerUtils.installWalletHandlers($scope, w);
        controllerUtils.setFocusedWallet(w);
      });
    };
  });
