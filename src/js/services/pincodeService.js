'use strict';

angular.module('copayApp.services').factory('pincodeService', function($log, $rootScope, $ionicModal, configService) {
  var root = {};

  var openPincodeModal = function(opts) {
    var scope = $rootScope.$new(true);
    scope.from = opts.from;
    scope.enabled = opts.enabled;
    $ionicModal.fromTemplateUrl('views/modals/pincode.html', {
      scope: scope,
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function(modal) {
      scope.pincodeModal = modal;
      scope.pincodeModal.show();
    });
  };

  root.lockChange = function(opts, cb) {
    if (opts.enabled) console.log('Locking app from service');
    else console.log('Unlocking app from service');
    openPincodeModal(opts);
  };

  root.isLocked = function() {
    var config = configService.getSync();
    return config.pincode ? config.pincode.enabled : false;
  };

  return root;
});
