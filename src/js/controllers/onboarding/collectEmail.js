'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $log, $timeout, $http, $httpParamSerializer, profileService, configService, walletService, appConfigService) {

  var wallet, walletId;
  $scope.data = {};
  // Get more info: https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
  var URL = "https://script.google.com/macros/s/AKfycbwQXvUw6-Ix0cRLMi7hBB8dlgNTCTgwfNIQRds6RypPV7dO8evW/exec";

  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletId = data.stateParams.walletId;
    wallet = profileService.getWallet(walletId);
    $scope.data.accept = true;
  });

  var collectEmail = function() {
    var dataSrc = {
      "App": appConfigService.nameCase,
      "Email": $scope.data.email,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version()
    };

    $http(_post(dataSrc)).then(function() {
      $log.info("SUCCESS: Email collected");
    }, function(err) {
      $log.error("ERROR: Could not collect email");
    });
  };

  $scope.save = function() {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = $scope.data.email;
    walletService.updateRemotePreferences(wallet, {
      email: $scope.data.email,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        if ($scope.data.accept) collectEmail();
        $scope.goNextView();
      });
    });
  };

  $scope.goNextView = function() {
    $state.go('onboarding.backupRequest', {
      walletId: walletId
    });
  };

  $scope.confirm = function(emailForm) {
    if (emailForm.$invalid) return;
    $scope.confirmation = true;
  };

  $scope.cancel = function() {
    $scope.confirmation = false;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

});
