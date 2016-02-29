'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $timeout, configService, uxLanguage, go) {

    this.availableLanguages = uxLanguage.getLanguages();
    this.currentLanguage = uxLanguage.getCurrentLanguage();

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
        $scope.$emit('Local/LanguageSettingUpdated');
        $timeout(function() {
          $scope.$apply();
        }, 100);
      });
    };
  });
