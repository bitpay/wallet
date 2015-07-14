'use strict';

angular.module('copayApp.controllers').controller('preferencesAliasController',
  function($scope, $timeout, configService, profileService, go) {
    var config = configService.getSync();
    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;

    var config = configService.getSync();
    config.aliasFor = config.aliasFor || {};
    this.alias = config.aliasFor[walletId] || fc.credentials.walletName;

    this.save = function() {
      var self = this;
      var opts = {
        aliasFor: {}
      };
      opts.aliasFor[walletId] = self.alias;

      configService.set(opts, function(err) {
        if (err) {
          $scope.$emit('Local/DeviceError', err);
          return;
        }
        $scope.$emit('Local/AliasUpdated');
        $timeout(function(){
          go.path('preferences');
        }, 50);
      });

    };
  });
