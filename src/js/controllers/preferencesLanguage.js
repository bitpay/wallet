'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, $ionicHistory, configService, profileService, uxLanguage, walletService, externalLinkService, gettextCatalog) {

    $scope.availableLanguages = uxLanguage.getLanguages();

    $scope.openExternalLink = function() {
      var url = 'https://crowdin.com/project/copay';
      var optIn = true;
      var title = gettextCatalog.getString('Open Translation Community');
      var message = gettextCatalog.getString('You can make contributions by signing up on our Crowdin community translation website. We’re looking forward to hearing from you!');
      var okText = gettextCatalog.getString('Open Crowdin');
      var cancelText = gettextCatalog.getString('Go Back');
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
        walletService.updateRemotePreferences(profileService.getWallets());
      });

      $ionicHistory.goBack();
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.currentLanguage = uxLanguage.getCurrentLanguage();
    });
  });
