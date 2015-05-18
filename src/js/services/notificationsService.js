'use strict';
angular.module('copayApp.services')
  .factory('notificationService', function profileServiceFactory($filter, notification, lodash, configService, gettext) {

    var root = {};

    var groupingTime = 4000;
    var lastNotificationOnWallet = {};

    root.getLast = function(walletId) {
      var last = lastNotificationOnWallet[walletId];
      if (!last) return null;

      return Date.now() - last.ts < groupingTime ? last : null;
    };

    root.storeLast = function(notificationData, walletId) {
      lastNotificationOnWallet[walletId] = {
        creatorId: notificationData.creatorId,
        type: notificationData.type,
        ts: Date.now(),
      };
    };

    root.shouldSkip = function(notificationData, last) {
      if (!last) return false;

      // rules...
      if (last.type === 'NewTxProposal'
          && notificationData.type === 'TxProposalAcceptedBy')
        return true;

      if (last.type === 'TxProposalFinallyAccepted'
          && notificationData.type === 'NewOutgoingTx')
        return true;

      if (last.type === 'TxProposalRejectedBy'
          && notificationData.type === 'TxProposalFinallyRejected')
        return true;


      return false;
    };


    root.newBWCNotification = function(notificationData, walletId, walletName) {
      var last = root.getLast(walletId);
      root.storeLast(notificationData, walletId);

      if (root.shouldSkip(notificationData, last))
        return;

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      var color = config.colorFor[walletId] || '#7A8C9E';
      var name = config.aliasFor[walletId] || walletName;

      switch (notificationData.type) {
        case 'NewTxProposal':
          notification.new(gettext('New Transaction'),
            name, {color: color} );
          break;
        case 'TxProposalAcceptedBy':
          notification.success(gettext('Transaction Signed'),
            name, {color: color} );
          break;
        case 'TxProposalRejectedBy':
          notification.error(gettext('Transaction Rejected'),
            name, {color: color} );
          break;
        case 'TxProposalFinallyRejected':
          notification.error(gettext('A transaction was finally rejected'),
            name, {color: color} );
          break;
        case 'NewOutgoingTx':
          notification.sent(gettext('Transaction Sent'),
            name, {color: color} );
          break;
        case 'NewIncomingTx':
          notification.funds(gettext('Funds received'),
            name, {color: color} );
          break;
        case 'ScanFinished':
          notification.success(gettext('Scan Finished'),
            name, {color: color} );
          break;

        case 'NewCopayer':
          // No UX notification
          break;
      }
    };

    return root;
  });
