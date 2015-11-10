'use strict';
angular.module('copayApp.services')
  .factory('notificationService', function profileServiceFactory($filter, $log, notification, lodash, configService, gettext, themeService) {

    var root = {};

    var groupingTime = 5000;
    var lastNotificationOnWallet = {};

    root.getLast = function(walletId) {
      var last = lastNotificationOnWallet[walletId];
      if (!last) return null;

      return Date.now() - last.ts < groupingTime ? last : null;
    };

    root.storeLast = function(notificationData, walletId) {

      if (notificationData.type == 'NewAddress')
        return;

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
      var name = config.aliasFor[walletId] || walletName;

      var color = themeService.getPublishedSkin().textHighlightColor;
      var iconColor = themeService.getPublishedTheme().notificationBarIconColor;
      var barBackground = themeService.getPublishedTheme().notificationBarBackground;

      switch (notificationData.type) {
        case 'NewTxProposal':
          notification.new(gettext('New Payment Proposal'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'TxProposalAcceptedBy':
          notification.success(gettext('Payment Proposal Signed by Copayer'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'TxProposalRejectedBy':
          notification.error(gettext('Payment Proposal Rejected by Copayer'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'TxProposalFinallyRejected':
          notification.error(gettext('Payment Proposal Rejected'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'NewOutgoingTx':
          notification.sent(gettext('Payment Sent'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'NewIncomingTx':
          notification.funds(gettext('Funds received'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;
        case 'ScanFinished':
          notification.success(gettext('Scan Finished'),
            name,
            {color: color,
             iconColor: iconColor,
             barBackground: barBackground} );
          break;

        case 'NewCopayer':
          // No UX notification
          break;
      }
    };

    return root;
  });
