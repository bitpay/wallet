'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout, gettext) {
  var root = {};

  root.notify = function(txp, cb) {
    var fc = profileService.focusedClient;
    var msg;

    var status = txp.status;

    if (status == 'broadcasted') {
      msg = gettext('Transaction broadcasted');
    } else {
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });
      if (!action) {
        msg = gettext('Transaction proposal created');
      } else if (action.type == 'accept') {
        msg = gettext('Transaction proposal signed');
      } else if (action.type == 'reject') {
        msg = gettext('Transaction was rejected');
      }
    }

    root.openModal(msg, cb);
  };

  root.openModal = function(statusStr, cb) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.statusStr = statusStr;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
      if (cb) $timeout(cb, 100);
    };
    var modalInstance = $modal.open({
      templateUrl: 'views/modals/tx-status.html',
      windowClass: 'full popup-tx-status closeModalAnimation',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.finally(function() {
      var m = angular.element(document.getElementsByClassName('reveal-modal'));
      m.addClass('animated slideOutDown');
    });
  };

  return root;
});
