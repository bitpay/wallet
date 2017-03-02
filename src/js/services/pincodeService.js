'use strict';

angular.module('copayApp.services').factory('pincodeService', function($log, $rootScope, $ionicModal, configService) {
  var root = {};

  root.lockChange = function(opts) {
    var scope = $rootScope.$new(true);
    scope.from = opts.from;
    scope.locking = opts.locking;
    $ionicModal.fromTemplateUrl('views/modals/pincode.html', {
      scope: scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      scope.pincodeModal = modal;
      scope.pincodeModal.show();
    });
  };

  root.isLocked = function() {
    var config = configService.getSync();
    return config.pincode ? config.pincode.enabled : false;
  };

  return root;
});
