'use strict';

angular.module('copayApp.controllers').controller('CreateController',
  function($scope, $rootScope, $location, $timeout,  identityService, backupService, notification, defaults) {

    $rootScope.fromSetup = true;
    $scope.loading = false;
    $scope.walletPassword = $rootScope.walletPassword;
    $scope.isMobile = !!window.cordova;
    $scope.hideAdv = true;
    $scope.networkName = config.networkName;
    $rootScope.title = 'Create new wallet';

    // ng-repeat defined number of times instead of repeating over array?
    $scope.getNumber = function(num) {
      return new Array(num);
    }

    $scope.totalCopayers = config.wallet.totalCopayers;
    $scope.TCValues = _.range(1, config.limits.totalCopayers + 1);

    var updateRCSelect = function(n) {
      var maxReq = copay.Wallet.getMaxRequiredCopayers(n);
      $scope.RCValues = _.range(1, maxReq + 1);
      $scope.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    updateRCSelect($scope.totalCopayers);

    $scope.$watch('totalCopayers', function(tc) {
      updateRCSelect(tc);
    });

    $scope.$watch('networkName', function(tc) {
      $scope.networkUrl = config.network[$scope.networkName].url;
    });

    $scope.showNetwork = function() {
      return $scope.networkUrl != defaults.network.livenet.url && $scope.networkUrl != defaults.network.testnet.url;
    };

    $scope.create = function(form) {
      if (form && form.$invalid) {
        $scope.error = 'Please enter the required fields';
        return;
      }
      var opts = {
        requiredCopayers: $scope.requiredCopayers,
        totalCopayers: $scope.totalCopayers,
        name: $scope.walletName,
        privateKeyHex: $scope.private,
        networkName: $scope.networkName,
      };
      $rootScope.starting = true;
      identityService.createWallet(opts, function(err, wallet){
        $rootScope.starting = false;
        if (err || !wallet) {
          copay.logger.debug(err);
          if (err.match('OVERQUOTA')){
            $scope.error = 'Could not create wallet: storage limits on remove server exceeded';
          } else {
            $scope.error = 'Could not create wallet: ' + err;
          }
        }
        
        $timeout(function(){
          $rootScope.$digest();
        },1);
      });
    };
  });
