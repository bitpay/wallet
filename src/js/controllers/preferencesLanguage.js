'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $state, configService, profileService, uxLanguage, walletService) {

    $scope.init = function() {
      $scope.availableLanguages = uxLanguage.getLanguages();
      $scope.currentLanguage = uxLanguage.getCurrentLanguage();
    }

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

        $state.go('tabs.settings')
        uxLanguage.update(function() {
          walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };
  });
