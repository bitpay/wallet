'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout, gettext) {
  var root = {};

  root.notify = function(txp, cb) {
    var fc = profileService.focusedClient;
    var status = txp.status;
    var type;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {

      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });

      if (!action || (action.type == 'accept' && n == 1)) {
        type = 'created';
      } else if (action.type == 'accept') {
        type = 'accepted';
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
    }

    root.openModal(type, cb);
  };

  root.openModal = function(type, cb) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.type = type;
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
      m.addClass('animated fadeOutUp');
    });
  };

  return root;
});
