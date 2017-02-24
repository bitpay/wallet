import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';

import { TextService } from './text.service';

@Injectable()
export class BwcErrorService {

  constructor(
    public logger: Logger,
    public textService: TextService
  ) {}

  msg(err, prefix) {
    if (!err)
      return 'Unknown error';

    let name;

    if (err.name) {
      if (err.name == 'Error')
        name = err.message
      else
        name = err.name.replace(/^bwc.Error/g, '');
    } else
      name = err;

    let body = '';
    prefix = prefix || '';

    if (name) {
      switch (name) {
        case 'INVALID_BACKUP':
          body = this.textService.gettextCatalog.getString('Wallet Recovery Phrase is invalid');
          break;
        case 'WALLET_DOES_NOT_EXIST':
          body = this.textService.gettextCatalog.getString('Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase');
          break;
        case 'MISSING_PRIVATE_KEY':
          body = this.textService.gettextCatalog.getString('Missing private keys to sign');
          break;
        case 'ENCRYPTED_PRIVATE_KEY':
          body = this.textService.gettextCatalog.getString('Private key is encrypted, cannot sign');
          break;
        case 'SERVER_COMPROMISED':
          body = this.textService.gettextCatalog.getString('Server response could not be verified');
          break;
        case 'COULD_NOT_BUILD_TRANSACTION':
          body = this.textService.gettextCatalog.getString('Could not build transaction');
          break;
        case 'INSUFFICIENT_FUNDS':
          body = this.textService.gettextCatalog.getString('Insufficient funds');
          break;
        case 'CONNECTION_ERROR':
          body = this.textService.gettextCatalog.getString('Network connection error');
          break;
        case 'NOT_FOUND':
          body = this.textService.gettextCatalog.getString('Wallet service not found');
          break;
        case 'ECONNRESET_ERROR':
          body = this.textService.gettextCatalog.getString('Connection reset by peer');
          break;
        case 'BAD_RESPONSE_CODE':
          body = this.textService.gettextCatalog.getString('The request could not be understood by the server');
          break;
        case 'WALLET_ALREADY_EXISTS':
          body = this.textService.gettextCatalog.getString('Wallet already exists');
          break;
        case 'COPAYER_IN_WALLET':
          body = this.textService.gettextCatalog.getString('Copayer already in this wallet');
          break;
        case 'WALLET_FULL':
          body = this.textService.gettextCatalog.getString('Wallet is full');
          break;
        case 'WALLET_NOT_FOUND':
          body = this.textService.gettextCatalog.getString('Wallet not found');
          break;
        case 'INSUFFICIENT_FUNDS_FOR_FEE':
          body = this.textService.gettextCatalog.getString('Insufficient funds for fee');
          break;
        case 'LOCKED_FUNDS':
          body = this.textService.gettextCatalog.getString('Funds are locked by pending spend proposals');
          break;
        case 'COPAYER_VOTED':
          body = this.textService.gettextCatalog.getString('Copayer already voted on this spend proposal');
          break;
        case 'NOT_AUTHORIZED':
          body = this.textService.gettextCatalog.getString('Not authorized');
          break;
        case 'TX_ALREADY_BROADCASTED':
          body = this.textService.gettextCatalog.getString('Transaction already broadcasted');
          break;
        case 'TX_CANNOT_CREATE':
          body = this.textService.gettextCatalog.getString('Locktime in effect. Please wait to create a new spend proposal');
          break;
        case 'TX_CANNOT_REMOVE':
          body = this.textService.gettextCatalog.getString('Locktime in effect. Please wait to remove this spend proposal');
          break;
        case 'TX_NOT_ACCEPTED':
          body = this.textService.gettextCatalog.getString('Spend proposal is not accepted');
          break;
        case 'TX_NOT_FOUND':
          body = this.textService.gettextCatalog.getString('Spend proposal not found');
          break;
        case 'TX_NOT_PENDING':
          body = this.textService.gettextCatalog.getString('The spend proposal is not pending');
          break;
        case 'UPGRADE_NEEDED':
          body = this.textService.gettextCatalog.getString('Please upgrade Copay to perform this action');
          break;
        case 'BAD_SIGNATURES':
          body = this.textService.gettextCatalog.getString('Signatures rejected by server');
          break;
        case 'COPAYER_DATA_MISMATCH':
          body = this.textService.gettextCatalog.getString('Copayer data mismatch');
          break;
        case 'DUST_AMOUNT':
          body = this.textService.gettextCatalog.getString('Amount below minimum allowed');
          break;
        case 'INCORRECT_ADDRESS_NETWORK':
          body = this.textService.gettextCatalog.getString('Incorrect address network');
          break;
        case 'COPAYER_REGISTERED':
          body = this.textService.gettextCatalog.getString('Key already associated with an existing wallet');
          break;
        case 'INVALID_ADDRESS':
          body = this.textService.gettextCatalog.getString('Invalid address');
          break;
        case 'MAIN_ADDRESS_GAP_REACHED':
          body = this.textService.gettextCatalog.getString('Empty addresses limit reached. New addresses cannot be generated.');
          break;
        case 'WALLET_LOCKED':
          body = this.textService.gettextCatalog.getString('Wallet is locked');
          break;
        case 'WALLET_NOT_COMPLETE':
          body = this.textService.gettextCatalog.getString('Wallet is not complete');
          break;
        case 'WALLET_NEEDS_BACKUP':
          body = this.textService.gettextCatalog.getString('Wallet needs backup');
          break;
        case 'MISSING_PARAMETER':
          body = this.textService.gettextCatalog.getString('Missing parameter');
          break;
        case 'NO_PASSWORD_GIVEN':
          body = this.textService.gettextCatalog.getString('Spending Password needed');
          break;
        case 'PASSWORD_INCORRECT':
          body = this.textService.gettextCatalog.getString('Wrong spending password');
          break;
        case 'EXCEEDED_DAILY_LIMIT':
          body = this.textService.gettextCatalog.getString('Exceeded daily limit of $500 per user');
          break;
        case 'ERROR':
          body = (err.message || err.error);
          break;

        default:
          this.logger.warn('Unknown error type:', name);
          body = err.message || name;
          break;
      }
    } else if (err.message) {
      body = err.message;
    } else {
      body = err;
    }

    let msg = prefix + (body ? (prefix ? ': ' : '') + body : '');
    return msg;
  }

  cb(err, prefix, cb) {
    return cb(this.msg(err, prefix));
  };

}
