'use strict';

angular.module('copayApp.controllers').controller('SettingsController', function($scope, $rootScope, $window, $location, controllerUtils) {

  controllerUtils.redirIfLogged();
  $scope.title = 'Settings';
  $scope.defaultLanguage = config.defaultLanguage || 'en';
  $scope.insightLivenet = config.network.livenet.url;
  $scope.insightTestnet = config.network.testnet.url;

  $scope.availableLanguages = [{
    name: 'English',
    isoCode: 'en',
  }, {
    name: 'Spanish',
    isoCode: 'es',
  }];

  for (var ii in $scope.availableLanguages) {
    if ($scope.defaultLanguage === $scope.availableLanguages[ii].isoCode) {
      $scope.selectedLanguage = $scope.availableLanguages[ii];
      break;
    }
  }

  $scope.save = function() {
    var insightSettings = {
      livenet: {
        url: $scope.insightLivenet,
      },
      testnet: {
        url: $scope.insightTestnet,
      },
    }

    localStorage.setItem('config', JSON.stringify({
      network: insightSettings,
      version: copay.version,
      defaultLanguage: $scope.selectedLanguage.isoCode
    }));

    // Go home reloading the application
    var hashIndex = window.location.href.indexOf('#!/');
    window.location = window.location.href.substr(0, hashIndex);
  };
});
