'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $timeout, $log, $stateParams, $ionicHistory, configService, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.wallet = wallet;
  var walletId = wallet.credentials.walletId;
  var config = configService.getSync();
  config.colorFor = config.colorFor || {};

  $scope.colorCount = getColorCount();
  setCurrentColorIndex();

  $scope.save = function(i) {
    var color = indexToColor(i);
    if (!color) return;

    var opts = {
      colorFor: {}
    };
    opts.colorFor[walletId] = color;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      $ionicHistory.goBack();
    });
  };

  function getColorCount() {
    var count = window.getComputedStyle(document.getElementsByClassName('wallet-color-count')[0]).content;
    return parseInt(count.replace(/\"/g, ''));
  };

  function setCurrentColorIndex() {
    // Wait for DOM to render
    $timeout(function() {
      $scope.currentColorIndex = colorToIndex(config.colorFor[walletId] || '#4A90E2');
      if (!$scope.currentColorIndex) {
        setCurrentColorIndex();
      }
    }, 100);
  };

  function colorToIndex(color) {
    for (var i = 0; i < $scope.colorCount; i++) {
      if (indexToColor(i) == color) {
        return i;
      }
    }
    return undefined;
  };

  function indexToColor(i) {
    function rgb2hex(rgb) {
      rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
      return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
    };
    var color;
    try {
      color = rgb2hex(window.getComputedStyle(document.getElementsByClassName('wallet-color-' + i)[0]).backgroundColor);
    } catch(e) {
      color = undefined;
    }
    return color;
  };

});
