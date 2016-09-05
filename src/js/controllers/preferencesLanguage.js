'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $ionicNavBarDelegate, $ionicHistory, gettextCatalog, configService, profileService, uxLanguage, walletService, externalLinkService) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('Language'));

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

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

        $ionicHistory.goBack();
        uxLanguage.update(function() {
          walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };
  });
