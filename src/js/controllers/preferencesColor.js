'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $log, $stateParams, $ionicHistory, gettextCatalog, configService, profileService) {
  $scope.colorList = [
        '#DD4B39',
        '#F38F12',
        '#FAA77F',
        '#D0B136',
        '#9EDD72',
        '#29BB9C',
        '#019477',
        '#77DADA',
        '#4A90E2',
        '#484ED3',
        '#9B59B6',
        '#E856EF',
        '#FF599E',
        '#7A8C9E',
      ];

  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  config.colorFor = config.colorFor || {};

  $scope.currentColor = config.colorFor[walletId] || '#4A90E2';

  $scope.save = function(color) {
    var opts = {
      colorFor: {}
    };
    opts.colorFor[walletId] = color;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };
});
