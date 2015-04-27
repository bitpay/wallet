'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $rootScope, configService, go, rateService, lodash) {
    this.hideAdv = true;
    this.hidePriv = true;
    this.hideSecret = true;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.selectedAlternative = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };

    this.alternativeOpts = [this.selectedAlternative]; //default value

    var self = this;
    rateService.whenAvailable(function() {
      self.alternativeOpts = rateService.listAlternatives();
      lodash.remove(self.alternativeOpts, function(n) {
        return n.isoCode == 'BTC';
      });

      for (var ii in self.alternativeOpts) {
        if (config.wallet.settings.alternativeIsoCode === self.alternativeOpts[ii].isoCode) {
          self.selectedAlternative = self.alternativeOpts[ii];
        }
      }
      $scope.$digest();
    });


    this.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };
      this.selectedAlternative = {
        name: newAltCurrency.name,
        isoCode: newAltCurrency.isoCode,
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        $scope.$emit('Local/UnitSettingUpdated');
      });
    };


  });
