'use strict';

angular.module('copayApp.controllers').controller('SettingsController', function($scope, $rootScope, $window, $route, $location, $anchorScroll, notification, applicationService, localstorageService) {
  $scope.title = 'Settings';
  $scope.defaultLanguage = config.defaultLanguage || 'en';
  $scope.insightLivenet = config.network.livenet.url;
  $scope.insightTestnet = config.network.testnet.url;
  $scope.defaultLogLevel = config.logLevel || 'log';


  var localStorage;

  var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;
  if (isChromeApp) {
    console.log('Is a chrome app!');
    localStorage = chrome.storage.local;
  } else {
    console.log('Is web!');
    localStorage = window.localStorage;
  }

  var logLevels = copay.logger.getLevels();

  $scope.availableLogLevels = [];


  for (var key in logLevels) {
    $scope.availableLogLevels.push({
      'name': key
    });
  }

  $scope.availableStorages = [{
      name: 'Insight',
      pluginName: 'EncryptedInsightStorage',
    }, {
      name: 'Localstorage',
      pluginName: 'EncryptedLocalStorage',
    },
    // {
    //   name: 'GoogleDrive',
    //   pluginName: 'GoogleDrive',
    // }
  ];

  _.each($scope.availableStorages, function(v) {
    if (config.plugins[v.pluginName])
      $scope.selectedStorage = v;
  });

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

  for (var ii in $scope.availableLogLevels) {
    if ($scope.defaultLogLevel === $scope.availableLogLevels[ii].name) {
      $scope.selectedLogLevel = $scope.availableLogLevels[ii];
      break;
    }
  }


  $scope.save = function() {
    $scope.insightLivenet = copay.Insight.setCompleteUrl($scope.insightLivenet);
    $scope.insightTestnet = copay.Insight.setCompleteUrl($scope.insightTestnet);


    var insightSettings = {
      livenet: {
        url: $scope.insightLivenet,
        transports: ['polling'],
      },
      testnet: {
        url: $scope.insightTestnet,
        transports: ['polling'],
      },
    }


    var plugins = {};
    plugins[$scope.selectedStorage.pluginName] = true;
    copay.logger.setLevel($scope.selectedLogLevel.name);

    localstorageService.setItem('config', JSON.stringify({
      network: insightSettings,
      version: copay.version,
      defaultLanguage: $scope.selectedLanguage.isoCode,
      plugins: plugins,
      logLevel: $scope.selectedLogLevel.name,
      EncryptedInsightStorage: _.extend(config.EncryptedInsightStorage, {
        url: insightSettings.livenet.url + '/api/email'
      }),
      rates: _.extend(config.rates, {
        url: insightSettings.livenet.url + '/api/rates'
      }),
    }), function() {
      applicationService.restart();
    });
  };


  $scope.reset = function() {
    localstorageService.removeItem('config', function() {
      applicationService.reload();
    });
  };

});
