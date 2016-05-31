'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal, lodash, profileService, $timeout, txFormatService, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  root.notify = function(txp, cb) {
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

    openModal(type, txp, cb);
  };

  root._templateUrl = function(type, txp) {
    return 'views/modals/tx-status.html';
  };

  var openModal = function(type, txp, cb) {
    var fc = profileService.focusedClient;
    var ModalInstanceCtrl = function($scope, $modalInstance) {
      $scope.type = type;
      $scope.tx = txFormatService.processTx(txp);
      $scope.color = fc.backgroundColor;
      if (isCordova && StatusBar.isVisible) {
        StatusBar.hide();
      }
      $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
      };
      if (cb) $timeout(cb, 100);
    };
    var modalInstance = $modal.open({
      templateUrl: root._templateUrl(type, txp),
      windowClass: 'popup-tx-status full',
      controller: ModalInstanceCtrl,
    });

    modalInstance.result.finally(function() {
      if (isCordova && !StatusBar.isVisible) {
        StatusBar.show();
      }
      var m = angular.element(document.getElementsByClassName('reveal-modal'));
      m.addClass('hideModal');
    });
  };

  return root;
});
