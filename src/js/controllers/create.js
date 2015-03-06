'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService, configService, isCordova) {

    var self = this;
    var defaults = configService.getDefaults();

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    // ng-repeat defined number of times instead of repeating over array?
    this.getNumber = function(num) {
      return new Array(num);
    }

    var updateRCSelect = function(n) {
      var maxReq = COPAYER_PAIR_LIMITS[n];
      self.RCValues = lodash.range(1, maxReq + 1);
      $scope.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    $scope.$watch('totalCopayers', function(tc) {
      updateRCSelect(tc);
    });

    this.TCValues = lodash.range(1, defaults.limits.totalCopayers + 1);
    $scope.totalCopayers = defaults.wallet.totalCopayers;

    this.create = function(form) {
      if (form && form.$invalid) {
        this.error = 'Please enter the required fields';
        return;
      }
      var opts = {
        m: $scope.requiredCopayers,
        n: $scope.totalCopayers,
        name: form.walletName.$modelValue,
        extendedPrivateKey: form.privateKey.$modelValue,
        myName: $scope.totalCopayers > 1 ? form.myName.$modelValue : null,
        networkName: form.isTestnet.$modelValue ? 'testnet' : 'livenet'
      };
      self.loading = true;

      $timeout(function() {
        profileService.createWallet(opts, function(err, secret) {
          self.loading = false;
          if (err) {
            $log.debug(err);
            self.error = 'Could not create wallet: ' + err;
          }
          else {
            go.walletHome();
          }
        });
      }, 100);
    };

    $scope.$on("$destroy", function() {
      $rootScope.hideWalletNavigation = false;
    });
  });
