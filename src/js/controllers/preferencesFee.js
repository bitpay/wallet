'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController',
  function($rootScope, $scope, configService, go, gettext) {
    var config = configService.getSync();
    this.feeName = config.wallet.settings.feeName || 'Priority';
    this.feeOpts = [{
      name: gettext('Priority'),
      value: 100,
    }, {
      name: gettext('Normal'),
      value: 50,
    }, {
      name: gettext('Economy'),
      value: 10,
    }, {
      name: gettext('Emergency'),
      red: true,
      value: 500,
    }, ];

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
