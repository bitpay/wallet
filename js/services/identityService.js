'use strict';

angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, $timeout, pluginManager, controllerUtils) {
    var root = {};

    root.check = function(scope) {
      copay.Identity.checkIfExistsAny({
        pluginManager: pluginManager,
      }, function(anyProfile) {
        copay.Wallet.checkIfExistsAny({
          pluginManager: pluginManager,
        }, function(anyWallet) {
          scope.loading = false;
          scope.anyProfile = anyProfile ? true : false;
          scope.anyWallet = anyWallet ? true : false;

          if (!scope.anyProfile) {
            $location.path('/createProfile');
          }
        });
      });
    };

    root.create = function(scope, form) {
      copay.Identity.create({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
        failIfExists: true,
      }, function(err, iden) {
        if (err || !iden) {
          copay.logger.debug(err);
          if (err && (err.match('EEXISTS') || err.match('BADCREDENTIALS'))) {
            scope.error = 'User already exists!';
          } else {
            scope.error = 'Unknown error when connecting Insight Server';
          }
          $rootScope.starting = false;
          $timeout(function() {
            $rootScope.$digest()
          }, 1);          
          return;
        }
        var walletOptions = {
          nickname: iden.fullName,
          networkName: config.networkName,
          requiredCopayers: 1,
          totalCopayers: 1,
          password: iden.password,
          name: 'My wallet',
        };
        iden.createWallet(walletOptions, function(err, wallet) {
          if (err || !wallet) {
            copay.logger.debug(err);
            scope.error = 'Could not create default wallet';
            $rootScope.starting = false;
            $timeout(function() {
              $rootScope.$digest()
            }, 1);
            return;
          }
          controllerUtils.bindProfile(scope, iden, wallet.id);
        });
      });

    };


    root.open = function(scope, form) {
      copay.Identity.open({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      }, function(err, iden) {
        if (err && !iden) {
          if ((err.toString() || '').match('PNOTFOUND')) {
            scope.error = 'Invalid email or password';
          } else {
            scope.error = 'Unknown error';
          }
          $rootScope.starting = false;
          $timeout(function() {
            $rootScope.$digest()
          }, 1);          
        } else {

console.log('[identityService.js.95] LISTO OPEN!!'); //TODO
          var firstWallet = iden.getLastFocusedWallet();
          controllerUtils.bindProfile(scope, iden, firstWallet);
        }
      });
    };

    return root;
  });
