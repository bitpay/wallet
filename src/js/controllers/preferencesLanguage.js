'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $timeout, configService, go, uxLanguage) {

    this.availableLanguages = uxLanguage.getLanguages();

console.log('[preferencesLanguage.js.7]', this.availableLanguages); //TODO
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
        $scope.$emit('Local/LanguageSettingUpdated');
        $timeout(function() {
          go.preferences();
        }, 100);
      });
    };
  });
