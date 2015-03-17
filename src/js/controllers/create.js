'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService, configService, notification, isMobile, isCordova) {

    var self = this;

    var defaults = configService.getDefaults();
    $rootScope.fromSetup = true;

    this.loading = false;
    this.walletPassword = $rootScope.walletPassword;
    this.isMobile = isMobile.any();
    this.hideAdv = true;
    this.networkName = 'livenet';
    $rootScope.title = 'Create new wallet';
    $rootScope.hideWalletNavigation = true;
    this.isWindowsPhoneApp = isMobile.Windows() && isCordova;

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
    $scope.$watch('networkName', function(tc) {
      self.networkUrl = defaults.insight[self.networkName].url;
    });

    this.shouldShowNetwork = function() {
      return self.networkUrl != defaults.insight[self.networkName].url;
    };


    this.create = function(form) {
      if (form && form.$invalid) {
        this.error = 'Please enter the required fields';
        return;
      }
      console.log('[create.js.72:form:]', form); //TODO
      var opts = {
        m: $scope.requiredCopayers,
        n: $scope.totalCopayers,
        name: form.walletName.$modelValue,
        privateKeyHex: form.privateKey.$modelValue,
        networkName: form.networkName.$modelValue,
      };
      $rootScope.starting = true;

      profileService.createWallet(opts, function(err, secret) {
        $rootScope.starting = false;
        if (err) {
          $log.debug(err);
          self.error = 'Could not create wallet: ' + err;
        }
        go.walletHome();
        // TODO secret

        $timeout(function() {
          $rootScope.$apply();
        }, 1);
      });
    };

    $scope.$on("$destroy", function() {
      $rootScope.hideWalletNavigation = false;
    });
  });
