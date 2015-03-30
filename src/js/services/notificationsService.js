'use strict';
angular.module('copayApp.services')
  .factory('notificationService', function profileServiceFactory($filter, notification) {

    var root = {};

    root.newBWCNotification = function(notificationData, walletData) {
      switch (notificationData.type) {
        case 'NewTxProposal':
          notification.info('[' + walletData.walletName + '] New Transaction',
            $filter('translate')('You received a transaction proposal from') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalAcceptedBy':
          notification.success('[' + walletData.walletName + '] Transaction Signed',
            $filter('translate')('A transaction was signed by') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalRejectedBy':
          notification.warning('[' + walletData.walletName + '] Transaction Rejected',
            $filter('translate')('A transaction was rejected by') + ' ' + notificationData.creatorId);
          break;
        case 'TxProposalFinallyRejected':
          notification.success('[' + walletData.walletName + '] Transaction Rejected',
            $filter('translate')('A transaction was finally rejected'));
        case 'NewOutgoingTx':
          notification.success('[' + walletData.walletName + '] Transaction Sent',
            $filter('translate')('A transaction was broadcasted by') + ' ' + notificationData.creatorId);
          break;
        case 'NewIncomingTx':
          notification.success('[' + walletData.walletName + '] Funds Received',
            $filter('translate')('TODO TODO TODO ') + ' ' + notificationData.creatorId);
          break;
        case 'NewCopayer':
          // No UX notification
          break;
      }
    };

    return root;
  });
