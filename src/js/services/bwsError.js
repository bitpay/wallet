'use strict';
angular.module('copayApp.services')
  .factory('bwsError', function bwcErrorService($log, gettext) {
    var root = {};
   
   root.msg = function(err, prefix) {
      var body = '';
      prefix = prefix || '';

      if  (err && err.code)  {
        switch(err.code) {
          case 'CONNECTION_ERROR':
            body = gettext('Network connection error');
            break;
            ;;
          case 'NOT_FOUND':
            body = gettext('Wallet service not found');
            break;
            ;;
          case 'BAD_SIGNATURES': 
            body = gettext('Signatures rejected by server');
            break;
            ;;
          case 'COPAYER_DATA_MISMATCH': 
            body = gettext('Copayer data mismatch');
            break;
            ;;
          case 'COPAYER_IN_WALLET': 
            body = gettext('Copayer already in this wallet');
            break;
            ;;
          case 'COPAYER_REGISTERED': 
            body = gettext('Copayer already registered');
            break;
            ;;
          case 'COPAYER_VOTED': 
            body = gettext('Copayer already voted on this spend proposal');
            break;
            ;;
          case 'DUST_AMOUNT': 
            body = gettext('Amount  below dust threshold');
            break;
            ;;
          case 'INCORRECT_ADDRESS_NETWORK': 
            body = gettext('Incorrect address network');
            break;
            ;;
          case 'INSUFFICIENT_FUNDS': 
            body = gettext('Insufficient funds');
            break;
            ;;
          case 'INSUFFICIENT_FUNDS_FOR_FEE': 
            body = gettext('Insufficient funds for fee');
            break;
            ;;
          case 'INVALID_ADDRESS': 
            body = gettext('Invalid address');
            break;
            ;;
          case 'LOCKED_FUNDS': 
            body = gettext('Funds are locked by pending spend proposals');
            break;
            ;;
          case 'NOT_AUTHORIZED': 
            body = gettext('Not authorized');
            break;
            ;;
          case 'TX_ALREADY_BROADCASTED': 
            body = gettext('Transaction already broadcasted');
            break;
            ;;
          case 'TX_CANNOT_CREATE': 
            body = gettext('Locktime in effect. Please wait to create a new spend proposal');
            break;
            ;;
          case 'TX_CANNOT_REMOVE': 
            body = gettext('Locktime in effect. Please wait to remove this spend proposal');
            break;
            ;;
          case 'TX_NOT_ACCEPTED': 
            body = gettext('Spend proposal is not accepted');
            break;
            ;;
          case 'TX_NOT_FOUND': 
            body = gettext('Spend proposal not found');
            break;
            ;;
          case 'TX_NOT_PENDING': 
            body = gettext('The spend proposal is not pending');
            break;
            ;;
          case 'UPGRADE_NEEDED': 
            body = gettext('Please upgrade Copay to perform this action');
            break;
            ;;
          case 'WALLET_ALREADY_EXISTS': 
            body = gettext('Wallet already exists');
            break;
            ;;
          case 'WALLET_FULL': 
            body = gettext('Wallet is full');
            break;
            ;;
          case 'WALLET_NOT_COMPLETE': 
            body = gettext('Wallet is not complete');
            break;
            ;;
          case 'WALLET_NOT_FOUND': 
            body = gettext('Wallet not found');
            break;
            ;;
        }
      }

      var msg = prefix + ( body ? ': ' + body  : '');
      $log.warn("BWC ERROR:" +  msg);
      return msg;
    };

    root.cb = function (err,prefix, cb) {
      return cb(root.msg(err, prefix))
    };

    return root;
  });
