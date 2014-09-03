'use strict';

angular.module('copayApp.controllers').controller('SettingsController', function($scope, $rootScope, $window, $location, controllerUtils) {

  controllerUtils.redirIfLogged();
  $scope.title = 'Settings';
  $scope.insightHost = config.blockchain.host;
  $scope.insightPort = config.blockchain.port;
  $scope.insightSecure = config.blockchain.schema === 'https';
  $scope.defaultLanguage = config.defaultLanguage || 'en';

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



  $scope.changeInsightSSL = function() {
    $scope.insightPort = $scope.insightSecure ? 80 : 443;
  };


  $scope.save = function() {
    var network = config.network;
    network.host = $scope.insightHost;
    network.port = $scope.insightPort;
    network.schema = $scope.insightSecure ? 'https' : 'http';

    localStorage.setItem('config', JSON.stringify({
      networkName: $scope.networkName,
      blockchain: {
        host: $scope.insightHost,
        port: $scope.insightPort,
        schema: $scope.insightSecure ? 'https' : 'http',
      },
      socket: {
        host: $scope.insightHost,
        port: $scope.insightPort,
        schema: $scope.insightSecure ? 'https' : 'http',
      },
      network: network,
      unitName: $scope.selectedUnit.shortName,
      unitToSatoshi: $scope.selectedUnit.value,
      unitDecimals: $scope.selectedUnit.decimals,
      alternativeName: $scope.selectedAlternative.name,
      alternativeIsoCode: $scope.selectedAlternative.isoCode,

      version: copay.version,
      defaultLanguage: $scope.selectedLanguage.isoCode
    }));

    // Go home reloading the application
    var hashIndex = window.location.href.indexOf('#!/');
    window.location = window.location.href.substr(0, hashIndex);
  };
});
