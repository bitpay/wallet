'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, configService, profileService, uxLanguage, walletService, go) {

    $scope.availableLanguages = uxLanguage.getLanguages();
    $scope.currentLanguage = uxLanguage.getCurrentLanguage();

    $scope.save = function(newLang) {
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
