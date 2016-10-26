'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $timeout, $log, $stateParams, $ionicHistory, gettextCatalog, configService, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  $scope.colorList = configService.getColorList();
  config.colorFor = config.colorFor || {};
  $scope.currentColor = config.colorFor[walletId] || '#4A90E2';

  $timeout(function() {
    $scope.$apply();
  });

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
