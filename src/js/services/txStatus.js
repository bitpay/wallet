'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService) {
  var root = {};

  root.notify = function(txp) {
    var fc = profileService.focusedClient;
    var msg;

    var status = txp.status;
    
    if (status == 'broadcasted') {
      msg = 'Transaction broadcasted';
    }
    else {
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });
      if (!action) {
        msg = 'Transaction proposal created';
      } else if (action.type == 'accept') {
        msg = 'Transaction proposal signed';
      } else if (action.type == 'reject') {
        msg = 'Transaction was rejected';
      }
    }

    if (msg)
      root.openModal(msg);
  };

  root.openModal = function(statusStr) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.statusStr = statusStr;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
    };
    $modal.open({
      templateUrl: 'views/modals/tx-status.html',
      windowClass: 'full',
      controller: ModalInstanceCtrl,
    });
  };

  return root;
});
