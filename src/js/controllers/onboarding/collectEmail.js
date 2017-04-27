'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $timeout, profileService, configService, walletService) {

  var wallet, walletId;
  $scope.data = {};

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    walletId = data.stateParams.walletId;
    wallet = profileService.getWallet(walletId);
    $scope.data.accept = true;
  });

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
