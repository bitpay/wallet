'use strict';

angular.module('copayApp.services').factory('txStatus', function($modal) {
  var root = {};

  root.notify = function(status) {
    var msg;
    if (status == copay.Wallet.TX_BROADCASTED)
      msg = 'Transaction broadcasted!';
    else if (status == copay.Wallet.TX_PROPOSAL_SENT)
      msg = 'Transaction proposal created';
    else if (status == copay.Wallet.TX_SIGNED)
      msg = 'Transaction proposal was signed';
    else if (status == copay.Wallet.TX_SIGNED_AND_BROADCASTED)
      msg = 'Transaction signed and broadcasted!';
    else if (status == 'txRejected')
      msg = 'Transaction was rejected!';

    if (msg) 
      root.openModal(msg);
    return msg ? true : false;
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
      windowClass: 'tiny',
      controller: ModalInstanceCtrl,
    });
  };

  return root;
});
