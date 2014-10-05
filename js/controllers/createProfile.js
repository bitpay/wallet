'use strict';

angular.module('copayApp.controllers').controller('CreateProfileController', function($scope, $rootScope, $location, notification, controllerUtils, pluginManager) {
  controllerUtils.redirIfLogged();

  $scope.createProfile = function(form) {

    $scope.loading = true;
    copay.Identity.create(form.email.$modelValue, form.password.$modelValue, {
      pluginManager: pluginManager,
      network: config.network,
      networkName: config.networkName,
      walletDefaults: config.wallet,
      passphrase: config.passphrase,
    }, function(err, iden ,w) {
      $rootScope.iden = iden;
      $rootScope.wallet = w;
      controllerUtils.bindWallet(w, $scope);
    });
  }

});
