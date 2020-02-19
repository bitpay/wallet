import { TestUtils } from '../../test';
import { BwcErrorProvider } from './bwc-error';

describe('BwcErrorProvider: Bwc Error Provider', () => {
  let bwcErrorProvider: BwcErrorProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    bwcErrorProvider = testBed.get(BwcErrorProvider);
  });

  describe('msg function', () => {
    it('should return Unknown error if no error', () => {
      expect(bwcErrorProvider.msg(null)).toEqual('Unknown error');
    });

    it('should add prefix to the error', () => {
      expect(
        bwcErrorProvider.msg('INSUFFICIENT_FUNDS', 'error prefix')
      ).toEqual('error prefix: Insufficient funds');
    });

    it('should switch beetween error codes and return the correct translation', () => {
      let err;
      err = new Error('UNCONFIRMED_INPUTS_NOT_ACCEPTED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'This invoice does not accept unconfirmed inputs.'
      );

      err = new Error('INPUT_NOT_FOUND');
      expect(bwcErrorProvider.msg(err)).toEqual(
        "We could not find one or more inputs for your transaction on the blockchain. Make sure you're not trying to use unconfirmed change"
      );

      err = new Error('INVOICE_NOT_AVAILABLE');
      expect(bwcErrorProvider.msg(err)).toEqual('The invoice is no available');

      err = new Error('UNABLE_TO_PARSE_PAYMENT');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'We were unable to parse your payment. Please try again or contact your wallet provider'
      );

      err = new Error('NO_TRASACTION');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Your request did not include a transaction. Please try again or contact your wallet provider'
      );

      err = new Error('INVALID_TX_FORMAT');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Your transaction was an in an invalid format, it must be a hexadecimal string. Contact your wallet provider'
      );

      err = new Error('UNABLE_TO_PARSE_TX');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'We were unable to parse the transaction you sent. Please try again or contact your wallet provider'
      );

      err = new Error('WRONG_ADDRESS');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'The transaction you sent does not have any output to the address on the invoice'
      );

      err = new Error('WRONG_AMOUNT');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'The amount on the transaction does not match the amount requested. This payment will not be accepted'
      );

      err = new Error('NOT_ENOUGH_FEE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Transaction fee is below the current minimum threshold'
      );

      err = new Error('BTC_NOT_BCH');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'This invoice is priced in BTC, not BCH. Please try with a BTC wallet instead'
      );

      err = new Error('INVOICE_EXPIRED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'This invoice is no longer accepting payments'
      );

      err = new Error('INVALID_BACKUP');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Wallet Recovery Phrase is invalid'
      );

      err = new Error('WALLET_DOES_NOT_EXIST');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase'
      );

      err = new Error('MISSING_PRIVATE_KEY');
      expect(bwcErrorProvider.msg(err)).toEqual('Missing private keys to sign');

      err = new Error('ENCRYPTED_PRIVATE_KEY');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Private key is encrypted, cannot sign'
      );

      err = new Error('SERVER_COMPROMISED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Server response could not be verified'
      );

      err = new Error('COULD_NOT_BUILD_TRANSACTION');
      expect(bwcErrorProvider.msg(err)).toEqual('Could not build transaction');

      err = new Error('INSUFFICIENT_FUNDS');
      expect(bwcErrorProvider.msg(err)).toEqual('Insufficient funds');

      err = new Error('INSUFFICIENT_ETH_FEE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Your linked ETH wallet does not have enough ETH for fee'
      );

      err = new Error('CONNECTION_ERROR');
      expect(bwcErrorProvider.msg(err)).toEqual('Network error');

      err = new Error('NOT_FOUND');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet service not found');

      err = new Error('ECONNRESET_ERROR');
      expect(bwcErrorProvider.msg(err)).toEqual('Connection reset by peer');

      err = new Error('BAD_RESPONSE_CODE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'The request could not be understood by the server'
      );

      err = new Error('WALLET_ALREADY_EXISTS');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet already exists');

      err = new Error('COPAYER_IN_WALLET');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Copayer already in this wallet'
      );

      err = new Error('WALLET_FULL');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet is full');

      err = new Error('WALLET_NOT_FOUND');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet not found');

      err = new Error('INSUFFICIENT_FUNDS_FOR_FEE');
      expect(bwcErrorProvider.msg(err)).toEqual('Insufficient funds for fee');

      err = new Error('LOCKED_FUNDS');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Funds are locked by pending spend proposals'
      );

      err = new Error('LOCKED_ETH_FEE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Your ETH linked wallet funds are locked by pending spend proposals'
      );

      err = new Error('COPAYER_VOTED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Copayer already voted on this spend proposal'
      );

      err = new Error('NOT_AUTHORIZED');
      expect(bwcErrorProvider.msg(err)).toEqual('Not authorized');

      err = new Error('TX_ALREADY_BROADCASTED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Transaction already broadcasted'
      );

      err = new Error('TX_CANNOT_CREATE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Locktime in effect. Please wait to create a new spend proposal'
      );

      err = new Error('TX_CANNOT_REMOVE');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Locktime in effect. Please wait to remove this spend proposal'
      );

      err = new Error('TX_NOT_ACCEPTED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Spend proposal is not accepted'
      );

      err = new Error('TX_NOT_FOUND');
      expect(bwcErrorProvider.msg(err)).toEqual('Spend proposal not found');

      err = new Error('TX_NOT_PENDING');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'The spend proposal is not pending'
      );

      err = new Error('UPGRADE_NEEDED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Please upgrade the app to perform this action'
      );

      err = new Error('BAD_SIGNATURES');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Signatures rejected by server'
      );

      err = new Error('COPAYER_DATA_MISMATCH');
      expect(bwcErrorProvider.msg(err)).toEqual('Copayer data mismatch');

      err = new Error('DUST_AMOUNT');
      expect(bwcErrorProvider.msg(err)).toEqual('Amount below minimum allowed');

      err = new Error('INCORRECT_ADDRESS_NETWORK');
      expect(bwcErrorProvider.msg(err)).toEqual('Incorrect network address');

      err = new Error('COPAYER_REGISTERED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Key already associated with an existing wallet'
      );

      err = new Error('INVALID_ADDRESS');
      expect(bwcErrorProvider.msg(err)).toEqual('Invalid address');

      err = new Error('MAIN_ADDRESS_GAP_REACHED');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Empty addresses limit reached. New addresses cannot be generated.'
      );

      err = new Error('WALLET_LOCKED');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet is locked');

      err = new Error('WALLET_NOT_COMPLETE');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet is not complete');

      err = new Error('WALLET_NEEDS_BACKUP');
      expect(bwcErrorProvider.msg(err)).toEqual('Wallet needs backup');

      err = new Error('MISSING_PARAMETER');
      expect(bwcErrorProvider.msg(err)).toEqual('Missing parameter');

      err = new Error('NO_PASSWORD');
      expect(bwcErrorProvider.msg(err)).toEqual('No password');

      err = new Error('WRONG_PASSWORD');
      expect(bwcErrorProvider.msg(err)).toEqual('Wrong password');

      err = new Error('EXCEEDED_DAILY_LIMIT');
      expect(bwcErrorProvider.msg(err)).toEqual(
        'Exceeded daily limit of $500 per user'
      );

      err = new Error('ERROR');
      expect(bwcErrorProvider.msg(err)).toEqual('ERROR');

      err = new Error('UNKNOWN_ERROR');
      expect(bwcErrorProvider.msg(err)).toEqual('UNKNOWN_ERROR');

      err = 'ERROR_STRING';
      expect(bwcErrorProvider.msg(err)).toEqual('ERROR_STRING');
    });
  });
});
