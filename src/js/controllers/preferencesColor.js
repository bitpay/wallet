'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $log, $stateParams, $ionicHistory, gettextCatalog, configService, profileService) {
      $scope.colorList = [
        {color: "#DD4B39", name: "Cinnabar"},
        {color: "#F38F12", name: "Carrot Orange"},
        {color: "#FAA77F", name: "Light Salmon"},
        {color: "#D0B136", name: "Metallic Gold"},
        {color: "#9EDD72", name: "Feijoa"},
        {color: "#29BB9C", name: "Shamrock"},
        {color: "#019477", name: "Observatory"},
        {color: "#77DADA", name: "Turquoise Blue"},
        {color: "#4A90E2", name: "Cornflower Blue"},
        {color: "#484ED3", name: "Free Speech Blue"},
        {color: "#9B59B6", name: "Deep Lilac"},
        {color: "#E856EF", name: "Free Speech Magenta"},
        {color: "#FF599E", name: "Brilliant Rose"},
        {color: "#7A8C9E", name: "Light Slate Grey"}
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
