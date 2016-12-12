'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $ionicHistory, $state, gettextCatalog, configService, profileService, uxLanguage, walletService, externalLinkService) {

    $scope.availableLanguages = uxLanguage.getLanguages();

    $scope.openExternalLink = function(url, optIn, title, message, okText, cancelText) {
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.save = function(newLang) {
      var opts = {
        wallet: {
          settings: {
            defaultLanguage: newLang
          }
        }
      };

      uxLanguage._set(newLang);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });

      $ionicHistory.goBack();
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.currentLanguage = uxLanguage.getCurrentLanguage();
    });
  });
