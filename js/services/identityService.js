'use strict';

angular.module('copayApp.services')
  .factory('identityService', function($rootScope, $location, pluginManager, controllerUtils) {
    var root = {};

    root.check = function (scope) {
      copay.Identity.checkIfExistsAny({
        pluginManager: pluginManager,
      }, function(anyProfile) {
        copay.Wallet.checkIfExistsAny({
          pluginManager: pluginManager,
        }, function(anyWallet) {
          scope.retreiving = false;
          scope.anyProfile = anyProfile ? true : false;
          scope.anyWallet = anyWallet ? true : false;

          if (!scope.anyProfile) {
            $location.path('/createProfile');
          }
        });
      });
    };

    root.create = function(scope, form) {
      var iden = copay.Identity.create({
        email: form.email.$modelValue,
        password: form.password.$modelValue,
        pluginManager: pluginManager,
        network: config.network,
        networkName: config.networkName,
        walletDefaults: config.wallet,
        passphraseConfig: config.passphraseConfig,
      });

      var walletOptions = {
        nickname: iden.fullName,
        networkName: config.networkName,
        requiredCopayers: 1,
        totalCopayers: 1,
        password: iden.password,
        name: 'My wallet',
      };
      iden.createWallet(walletOptions, function(err, wallet) {
        if (err) {
          controllerUtils.onErrorDigest(
            scope, 'Could not create default wallet');
        } else {
          iden.store({failIfExists: true}, function(err) {
            if (err) {
              controllerUtils.onErrorDigest(scope, 'User already exists!');
            } else {
              controllerUtils.bindProfile(scope, iden, wallet.id);
            }
          });
        }
        scope.loading = false;
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
          controllerUtils.onErrorDigest(
            scope, (err.toString() || '').match('PNOTFOUND') ? 'Invalid email or password' : 'Unknown error');
        } else {
          var firstWallet = iden.getLastFocusedWallet();
          controllerUtils.bindProfile(scope, iden, firstWallet);
        }
        scope.loading = false;
      });
    }; 

    return root;
  });
