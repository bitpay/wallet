'use strict';
angular.module('copayApp.services')
  .factory('bwcError', function bwcErrorService($log, gettextCatalog) {
    var root = {};

    root.msg = function(err, prefix) {
      if (!err)
        return 'Unknown error';

      var name;

      if (err.name) {
        if (err.name == 'Error')
          name = err.message
        else
          name = err.name.replace(/^bwc.Error/g, '');
      } else
        name = err;

      var body = '';
      prefix = prefix || '';

      if (name) {
        switch (name) {
          case 'INVALID_BACKUP':
            body = gettextCatalog.getString('Wallet Recovery Phrase is invalid');
            break;
          case 'WALLET_DOES_NOT_EXIST':
            body = gettextCatalog.getString('Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase');
            break;
          case 'MISSING_PRIVATE_KEY':
            body = gettextCatalog.getString('Missing private keys to sign');
            break;
          case 'ENCRYPTED_PRIVATE_KEY':
            body = gettextCatalog.getString('Private key is encrypted, cannot sign');
            break;
          case 'SERVER_COMPROMISED':
            body = gettextCatalog.getString('Server response could not be verified');
            break;
          case 'COULD_NOT_BUILD_TRANSACTION':
            body = gettextCatalog.getString('Could not build transaction');
            break;
          case 'INSUFFICIENT_FUNDS':
            body = gettextCatalog.getString('Insufficient funds');
            break;
          case 'CONNECTION_ERROR':
            body = gettextCatalog.getString('Network error');
            break;
          case 'NOT_FOUND':
            body = gettextCatalog.getString('Wallet service not found');
            break;
          case 'ECONNRESET_ERROR':
            body = gettextCatalog.getString('Connection reset by peer');
            break;
          case 'BAD_RESPONSE_CODE':
            body = gettextCatalog.getString('The request could not be understood by the server');
            break;
          case 'WALLET_ALREADY_EXISTS':
            body = gettextCatalog.getString('Wallet already exists');
            break;
          case 'COPAYER_IN_WALLET':
            body = gettextCatalog.getString('Copayer already in this wallet');
            break;
          case 'WALLET_FULL':
            body = gettextCatalog.getString('Wallet is full');
            break;
          case 'WALLET_NOT_FOUND':
            body = gettextCatalog.getString('Wallet not found');
            break;
          case 'INSUFFICIENT_FUNDS_FOR_FEE':
            body = gettextCatalog.getString('Insufficient funds for fee');
            break;
          case 'LOCKED_FUNDS':
            body = gettextCatalog.getString('Funds are locked by pending spend proposals');
            break;
          case 'COPAYER_VOTED':
            body = gettextCatalog.getString('Copayer already voted on this spend proposal');
            break;
          case 'NOT_AUTHORIZED':
            body = gettextCatalog.getString('Not authorized');
            break;
          case 'TX_ALREADY_BROADCASTED':
            body = gettextCatalog.getString('Transaction already broadcasted');
            break;
          case 'TX_CANNOT_CREATE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to create a new spend proposal');
            break;
          case 'TX_CANNOT_REMOVE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to remove this spend proposal');
            break;
          case 'TX_NOT_ACCEPTED':
            body = gettextCatalog.getString('Spend proposal is not accepted');
            break;
          case 'TX_NOT_FOUND':
            body = gettextCatalog.getString('Spend proposal not found');
            break;
          case 'TX_NOT_PENDING':
            body = gettextCatalog.getString('The spend proposal is not pending');
            break;
          case 'UPGRADE_NEEDED':
            body = gettextCatalog.getString('Please upgrade Copay to perform this action');
            break;
          case 'BAD_SIGNATURES':
            body = gettextCatalog.getString('Signatures rejected by server');
            break;
          case 'COPAYER_DATA_MISMATCH':
            body = gettextCatalog.getString('Copayer data mismatch');
            break;
          case 'DUST_AMOUNT':
            body = gettextCatalog.getString('Amount below minimum allowed');
            break;
          case 'INCORRECT_ADDRESS_NETWORK':
            body = gettextCatalog.getString('Incorrect network address');
            break;
          case 'COPAYER_REGISTERED':
            body = gettextCatalog.getString('Key already associated with an existing wallet');
            break;
          case 'INVALID_ADDRESS':
            body = gettextCatalog.getString('Invalid address');
            break;
          case 'MAIN_ADDRESS_GAP_REACHED':
            body = gettextCatalog.getString('Empty addresses limit reached. New addresses cannot be generated.');
            break;
          case 'WALLET_LOCKED':
            body = gettextCatalog.getString('Wallet is locked');
            break;
          case 'WALLET_NOT_COMPLETE':
            body = gettextCatalog.getString('Wallet is not complete');
            break;
          case 'WALLET_NEEDS_BACKUP':
            body = gettextCatalog.getString('Wallet needs backup');
            break;
          case 'MISSING_PARAMETER':
            body = gettextCatalog.getString('Missing parameter');
            break;
          case 'NO_PASSWORD_GIVEN':
            body = gettextCatalog.getString('Spending Password needed');
            break;
          case 'PASSWORD_INCORRECT':
            body = gettextCatalog.getString('Wrong spending password');
            break;
          case 'EXCEEDED_DAILY_LIMIT':
            body = gettextCatalog.getString('Exceeded daily limit of $500 per user');
            break;
          case 'ERROR':
            body = (err.message || err.error);
            break;

          default:
            $log.warn('Unknown error type:', name);
            body = err.message || name;
            break;
        }
      } else if (err.message) {
        body = err.message;
      } else {
        body = err;
      }

      var msg = prefix + (body ? (prefix ? ': ' : '') + body : '');
      return msg;
    };

    root.cb = function(err, prefix, cb) {
      return cb(root.msg(err, prefix));
    };

    return root;
  });
