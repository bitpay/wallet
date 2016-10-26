'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $ionicHistory, gettextCatalog, configService, profileService, uxLanguage, walletService, externalLinkService) {

    $scope.availableLanguages = uxLanguage.getLanguages();

    $scope.openExternalLink = function(url, target) {
      externalLinkService.open(url, target);
    };

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
        uxLanguage.init(function() {
          walletService.updateRemotePreferences(profileService.getWallets(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };

    $scope.$on("$ionicView.enter", function(event, data){
      $scope.currentLanguage = uxLanguage.getCurrentLanguage();
    });
  });
