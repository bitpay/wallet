'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $timeout, configService, profileService, uxLanguage, walletService, go) {

    this.init = function() {
      this.availableLanguages = uxLanguage.getLanguages();
      $scope.data = {
        currentLanguage: uxLanguage.getCurrentLanguage()
      };
    };

    this.save = function(newLang) {
      var opts = {
        wallet: {
          settings: {
            defaultLanguage: newLang
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        go.preferencesGlobal();

        uxLanguage.update(function() {
          walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };
  });
