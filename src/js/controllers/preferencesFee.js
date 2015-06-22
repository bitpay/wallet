'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController',
  function($rootScope, $scope, configService, go) {
    var config = configService.getSync();
    this.feeName = config.wallet.settings.feeName || 'Priority';
    this.feeOpts = [{
      name: 'Priority',
      value: 100,
    }, {
      name: 'Normal',
      value: 50,
    }, {
      name: 'Economy',
      value: 10,
    }];

    this.save = function(newFee) {
      var opts = {
        wallet: {
          settings: {
            feeName: newFee.name,
            feeValue: newFee.value * 100,
          }
        }
      };
      this.feeName = newFee.name;

      configService.set(opts, function(err) {
        if (err) console.log(err);
        $scope.$emit('Local/UnitSettingUpdated');
      });

    };
  });
