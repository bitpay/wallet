'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $timeout, configService, applicationService) {
    this.defaultLanguage = configService.getSync().wallet.settings.defaultLanguage || 'en';

    this.save = function(newLang) {
      var opts = {
        wallet: {
          settings: {
            defaultLanguage: newLang
          }
        }
      };

      this.loading = true;
      $timeout(function() {
        configService.set(opts, function(err) {
          if (err) console.log(err);
          applicationService.restart();
        });
      }, 100);
    };
  });
