'use strict';

angular.module('copayApp.controllers').controller('preferencesAliasController',
  function($scope, $timeout, configService, profileService, go) {
    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    var config = configService.getSync();

    config.aliasFor = config.aliasFor || {};
    $scope.alias = config.aliasFor[walletId] || fc.credentials.walletName;

    $scope.save = function() {
      var opts = {
        aliasFor: {}
      };
      opts.aliasFor[walletId] = $scope.alias;

      configService.set(opts, function(err) {
        if (err) {
          $scope.$emit('Local/DeviceError', err);
          return;
        }
        $scope.$emit('Local/AliasUpdated');
        $timeout(function() {
          go.path('preferences');
        }, 50);
      });
    };
  });
