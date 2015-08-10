'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout) {
  var root = {};

  root.notify = function(txp, opts, cb) {
    if (typeof opts == "function") { // we have no options
      cb = opts;
    }
    var fc = profileService.focusedClient;
    var status = txp.status;
    var type;
    var INMEDIATE_SECS = 10;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {

      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });

      if (!action)  {
        type = 'created';
      } else if (action.type == 'accept') {
        // created and accepted at the same time?
        if ( n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS ) {
          type = 'created';
        } else {
          type = 'accepted';
        }
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
    }

    openModal(type, opts, cb);
  };

  var openModal = function(type, opts, cb) {
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.type = type;
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
      if (cb) $timeout(cb, 100);
    };
    var modalInstance = $modal.open({
      templateUrl: opts && opts.templateUrl ? opts.templateUrl : 'views/modals/tx-status.html',
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
