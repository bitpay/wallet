import { TestUtils } from '../../test';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { PersistenceProvider } from '../persistence/persistence';
import { RateProvider } from '../rate/rate';
import { TouchIdProvider } from '../touchid/touchid';
import { TxFormatProvider } from '../tx-format/tx-format';
import { WalletProvider } from './wallet';

// Mocks
import { PendingTxpMock } from './mocks/pending-txp.mock';
import {
  sendMaxInfoMock,
  statusMock,
  txsFromLocal,
  WalletMock
} from './mocks/wallet.mock';

describe('Provider: Wallet Provider', () => {
  let bwcErrorProvider: BwcErrorProvider;
  let configProvider: ConfigProvider;
  let feeProvider: FeeProvider;
  let rateProvider: RateProvider;
  let touchidProvider: TouchIdProvider;
  let txFormatProvider: TxFormatProvider;
  let walletProvider: WalletProvider;

  class PersistenceProviderMock {
    constructor() {}
    getLastAddress() {
      return Promise.resolve('storedAddress');
    }
    storeLastAddress(_, address) {
      return Promise.resolve(address);
    }
    getTxHistory(_walletId: string) {
      return Promise.resolve(txsFromLocal);
    }
    storeConfig(config) {
      return Promise.resolve(config);
    }
    setTxHistory(_walletId: string, _txs) {
      return Promise.resolve();
    }
    removeTxHistory(_walletId: string) {
      return Promise.resolve();
    }
    clearLastAddress(_walletId: string) {
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    bwcErrorProvider = testBed.get(BwcErrorProvider);
    configProvider = testBed.get(ConfigProvider);
    feeProvider = testBed.get(FeeProvider);
    rateProvider = testBed.get(RateProvider);
    touchidProvider = testBed.get(TouchIdProvider);
    txFormatProvider = testBed.get(TxFormatProvider);
    walletProvider = testBed.get(WalletProvider);

    spyOn(feeProvider, 'getFeeLevels').and.returnValue(
      Promise.resolve({
        levels: {
          livenet: [
            {
              feePerKb: 10000,
              level: 'normal'
            }
          ],
          testnet: [
            {
              feePerKb: 10000,
              level: 'normal'
            }
          ]
        }
      })
    );

    spyOn(bwcErrorProvider, 'msg').and.returnValue('Error');
  });

  describe('Function: getStatus', () => {
    beforeEach(() => {
      const newOpts = {
        wallet: {
          settings: {
            unitCode: 'btc',
            alternativeIsoCode: 'USD',
            unitToSatoshi: 100000000
          }
        }
      };
      configProvider.set(newOpts);

      spyOn(rateProvider, 'whenRatesAvailable').and.returnValue(
        Promise.resolve()
      );
      spyOn(rateProvider, 'toFiat').and.returnValue(1000000);
    });

    it('should get the status from a wallet that already have cachedStatus and no pendingTxps, without opts', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const expectedStatus = wallet.cachedStatus;
      walletProvider.getStatus(wallet, opts).then(status => {
        expect(status).toEqual(expectedStatus);
      });
    });

    it('should get the status from a wallet that already have cachedStatus and pendingTxps, without opts', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const pendingTxp: PendingTxpMock = new PendingTxpMock();

      wallet.cachedStatus.pendingTxps = [pendingTxp];
      const expectedStatus = wallet.cachedStatus;
      walletProvider.getStatus(wallet, opts).then(status => {
        expect(status).toEqual(expectedStatus);
      });
    });

    it('should get tx.pendingForUs as true if tx.status is pending', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const pendingTxp: PendingTxpMock = new PendingTxpMock();

      pendingTxp.status = 'pending';
      wallet.cachedStatus.pendingTxps = [pendingTxp];
      walletProvider.getStatus(wallet, opts).then(status => {
        expect(status.pendingTxps[0].pendingForUs).toBeTruthy();
      });
    });

    it('should set different statusForUs for different action types', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const pendingTxp1: PendingTxpMock = new PendingTxpMock();
      const pendingTxp2: PendingTxpMock = new PendingTxpMock();

      pendingTxp2.actions = [
        {
          version: '1.0.0',
          createdOn: 1542039348,
          copayerId: 'copayerId1',
          type: 'reject',
          signatures: ['signature1', 'signature2'],
          xpub: 'xpub1',
          comment: 'action2',
          copayerName: 'Satoshi Nakamoto'
        }
      ];

      // When copayerId == tx.wallet.copayerId
      wallet.copayerId = 'copayerId1';
      wallet.cachedStatus.pendingTxps = [pendingTxp1, pendingTxp2];

      walletProvider.getStatus(wallet, opts).then(status => {
        expect(status.pendingTxps[0].statusForUs).toEqual('accepted');
        expect(status.pendingTxps[1].statusForUs).toEqual('rejected');
      });
    });

    it('should get the status from a wallet that does not have cachedStatus', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      wallet.cachedStatus = null;
      const expectedStatus = {};
      const additionalExpectedStatusInfo = {
        email: null,
        balanceByAddress: [
          { address: 'address1', path: 'm/1/219', amount: 2000000 },
          { address: 'address2', path: 'm/1/26', amount: 7000000 }
        ],
        totalBalanceSat: 500000000,
        lockedBalanceSat: 100000000,
        availableBalanceSat: 400000000,
        totalBytesToSendMax: undefined,
        pendingAmount: 0,
        spendableAmount: 400000000,
        unitToSatoshi: 100000000,
        satToUnit: 1e-8,
        totalBalanceStr: '5.00 BTC',
        lockedBalanceStr: '1.00 BTC',
        availableBalanceStr: '4.00 BTC',
        spendableBalanceStr: '4.00 BTC',
        pendingBalanceStr: '0.00 BTC',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
        totalBalanceAlternative: '1,000,000',
        pendingBalanceAlternative: '1,000,000',
        lockedBalanceAlternative: '1,000,000',
        spendableBalanceAlternative: '1,000,000',
        alternativeConversionRate: '1,000,000',
        alternativeBalanceAvailable: true,
        isRateAvailable: true
      };
      Object.assign(expectedStatus, statusMock, additionalExpectedStatusInfo);

      walletProvider.getStatus(wallet, opts).then(status => {
        delete status['statusUpdatedOn'];
        delete expectedStatus['statusUpdatedOn'];
        expect(status).toEqual(expectedStatus);
      });
    });

    it('should get the correct status when config.spendUnconfirmed is enabled', () => {
      const newOpts = {
        wallet: {
          spendUnconfirmed: true
        }
      };
      configProvider.set(newOpts);

      const wallet: WalletMock = new WalletMock();
      const opts = {};
      wallet.cachedStatus = null;

      const expectedStatus = {};
      const additionalExpectedStatusInfo = {
        email: null,
        balanceByAddress: [
          { address: 'address1', path: 'm/1/219', amount: 2000000 },
          { address: 'address2', path: 'm/1/26', amount: 7000000 }
        ],
        totalBalanceSat: 500000000,
        lockedBalanceSat: 100000000,
        availableBalanceSat: 400000000,
        totalBytesToSendMax: undefined,
        pendingAmount: 0,
        spendableAmount: 400000000,
        unitToSatoshi: 100000000,
        satToUnit: 1e-8,
        totalBalanceStr: '5.00 BTC',
        lockedBalanceStr: '1.00 BTC',
        availableBalanceStr: '4.00 BTC',
        spendableBalanceStr: '4.00 BTC',
        pendingBalanceStr: '0.00 BTC',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
        totalBalanceAlternative: '1,000,000',
        pendingBalanceAlternative: '1,000,000',
        lockedBalanceAlternative: '1,000,000',
        spendableBalanceAlternative: '1,000,000',
        alternativeConversionRate: '1,000,000',
        alternativeBalanceAvailable: true,
        isRateAvailable: true
      };
      Object.assign(expectedStatus, statusMock, additionalExpectedStatusInfo);

      walletProvider.getStatus(wallet, opts).then(status => {
        delete status['statusUpdatedOn'];
        expect(status).toEqual(expectedStatus);
      });
    });
  });

  describe('Function: getAddressView', () => {
    beforeEach(() => {
      const newOpts = {
        wallet: {
          useLegacyAddress: false
        }
      };
      configProvider.set(newOpts);
    });

    it('should get the correct address with protocol format for BCH testnet', () => {
      spyOn(txFormatProvider, 'toCashAddress').and.returnValue(
        'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass'
      );

      const address = walletProvider.getAddressView(
        'bch',
        'testnet',
        'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass'
      );
      expect(address).toEqual(
        'bchtest:qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass'
      );
    });

    it('should get the correct address with protocol format for BCH livenet', () => {
      spyOn(txFormatProvider, 'toCashAddress').and.returnValue(
        'qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
      );

      const address = walletProvider.getAddressView(
        'bch',
        'livenet',
        'qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
      );
      expect(address).toEqual(
        'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
      );
    });

    it("should return the same address if it isn't BCH", () => {
      const address = walletProvider.getAddressView(
        'btc',
        'livenet',
        '3DTdZeycDBaimjuuknVGrG8fxdLbjsAjXN'
      );
      expect(address).toEqual('3DTdZeycDBaimjuuknVGrG8fxdLbjsAjXN');
    });

    it('should return the same address if it is BCH but use useLegacyAddress', () => {
      const newOpts = {
        wallet: {
          useLegacyAddress: true
        }
      };
      configProvider.set(newOpts);

      const address = walletProvider.getAddressView(
        'bch',
        'livenet',
        'CHp9UweEZXoFZ9sVDmT9ESS6zGysNeAn4j'
      );
      expect(address).toEqual('CHp9UweEZXoFZ9sVDmT9ESS6zGysNeAn4j');
    });
  });

  describe('Function: getAddress', () => {
    it('should get the last address stored', () => {
      const wallet: WalletMock = new WalletMock();
      const force = false;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('storedAddress');
      });
    });

    it('should reject to generate new address if wallet is not complete', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.isComplete = () => {
        return false;
      };

      const force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err);
      });
    });

    it('should reject to generate new address if wallet is not backed up', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.needsBackup = true;

      const force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err);
      });
    });

    it('should force to generate new address', () => {
      const wallet: WalletMock = new WalletMock();

      const force = true;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('address2');
      });
    });

    it('should reject to generate new address if connection error', () => {
      const wallet: WalletMock = new WalletMock();

      const force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err).toBeDefined();
      });
    });
    it('should return main address if gap reached', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.createAddress = ({}, cb) => {
        return cb(new Error('MAIN_ADDRESS_GAP_REACHED'));
      };
      const force = true;
      walletProvider.getAddress(wallet, force).then(mainAddress => {
        expect(mainAddress).toEqual('address1');
      });
    });
  });

  describe('Function: removeAndMarkSoftConfirmedTx', () => {
    const txs: any[] = [
      {
        confirmations: 1,
        recent: false
      },
      {
        confirmations: 50,
        recent: false
      }
    ];

    it('should filter soft confirmed Txs', () => {
      const filteredTxs: any[] = walletProvider.removeAndMarkSoftConfirmedTx(
        txs
      );
      expect(filteredTxs).toEqual([txs[1]]);
    });
  });

  describe('Function: getLowAmount', () => {
    it('Should approx utxo amount, from which the uxto is economically redeemable for a P2PKH wallet', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.network = 'livenet';
      wallet.credentials.addressType = 'P2PKH';
      walletProvider.getLowAmount(wallet).then(fee => {
        expect(fee).toEqual(16400);
      });
    });

    it('Should approx utxo amount, from which the uxto is economically redeemable for a 2-2 wallet', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.network = 'livenet';
      wallet.credentials.addressType = 'P2SH';
      wallet.m = 2;
      wallet.n = 2;
      walletProvider.getLowAmount(wallet).then(fee => {
        expect(Math.floor(fee)).toEqual(24066);
      });
    });
  });

  describe('Function: getTxNote', () => {
    it('Should wallet.getTxNote and get the note of a particular tx', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider.getTxNote(wallet, 'txid').then(note => {
        expect(note).toEqual('Note');
      });
    });
  });

  describe('Function: editTxNote', () => {
    it('Should call wallet.editTxNote', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider.editTxNote(wallet, 'txid').then(note => {
        expect(note).toEqual('NoteEdited');
      });
    });
  });

  describe('Function: getTxp', () => {
    it('Should call wallet.getTx and get the txp', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider.getTxp(wallet, 'txpid').then(txp => {
        expect(txp).toEqual({
          txid: 'txid'
        });
      });
    });
  });

  describe('Function: getTx', () => {
    it('Should get the tx info if wallet has a completeHistory', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.completeHistory = [
        {
          amount: 10000,
          fees: 99,
          txid: 'txid1'
        },
        {
          amount: 10000,
          fees: 99,
          txid: 'txid2'
        }
      ];
      wallet.completeHistory.isValid = true;
      walletProvider.getTx(wallet, 'txid1').then(tx => {
        expect(tx).toEqual({
          amount: 10000,
          fees: 99,
          txid: 'txid1'
        });
      });
      walletProvider.getTx(wallet, 'txid3').catch(err => {
        expect(err).toBeDefined();
      });
    });

    it("Should get the tx info if wallet hasn't a completeHistory", () => {
      const wallet: WalletMock = new WalletMock();

      spyOn(walletProvider, 'getTxHistory').and.returnValue(
        Promise.resolve([
          {
            amount: 10000,
            fees: 99,
            txid: 'txid1'
          },
          {
            amount: 10000,
            fees: 99,
            txid: 'txid2'
          }
        ])
      );

      walletProvider.getTx(wallet, 'txid1').then(tx => {
        expect(tx).toEqual({
          amount: 10000,
          fees: 99,
          txid: 'txid1'
        });
      });
    });
  });

  describe('Function: getTxHistory', () => {
    it('Should return the completeHistory if exists and isValid', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.completeHistory = [
        {
          amount: 10000,
          fees: 99,
          txid: 'txid1'
        },
        {
          amount: 10000,
          fees: 99,
          txid: 'txid2'
        }
      ];
      wallet.completeHistory.isValid = true;
      const opts = null;
      walletProvider.getTxHistory(wallet, opts).then(txHistory => {
        expect(txHistory).toEqual(wallet.completeHistory);
      });
    });

    it("Should return the completeHistory if isn't cached", () => {
      const wallet: WalletMock = new WalletMock();
      const opts = null;
      const expectedTxHistory = txsFromLocal;

      walletProvider.getTxHistory(wallet, opts).then(txHistory => {
        expect(txHistory.isValid).toBeTruthy();
        delete txHistory.isValid;
        expect(txHistory).toEqual(expectedTxHistory);
      });
    });
  });

  describe('Function: isEncrypted', () => {
    it('Should return undefined if there is no wallet', () => {
      const result: boolean = walletProvider.isEncrypted(null);
      expect(result).toBeUndefined();
    });

    it('Should return true if PrivKey is encrypted', () => {
      const wallet: WalletMock = new WalletMock();
      const result: boolean = walletProvider.isEncrypted(wallet);
      expect(result).toBeTruthy();
    });
  });

  describe('Function: createTx', () => {
    it('Should return the complete txp', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };

      walletProvider.createTx(wallet, txp).then(createdTxp => {
        expect(createdTxp.outputs).toBeDefined();
      });
    });
  });

  describe('Function: publishTx', () => {
    it('Should return the published txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };

      walletProvider.publishTx(wallet, txp).then(publishedTxp => {
        expect(publishedTxp.txid).toEqual('txid1');
      });
    });
  });

  describe('Function: signTx', () => {
    it('Should return the signed txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };
      const pass = 'password';

      walletProvider.signTx(wallet, txp, pass).then(signedTxp => {
        expect(signedTxp.txid).toEqual('txid1');
      });
    });
  });

  describe('Function: broadcastTx', () => {
    it('Should return the broadcasted txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000,
        status: 'accepted'
      };

      walletProvider.broadcastTx(wallet, txp).then(broadcastedTxp => {
        expect(broadcastedTxp.txid).toEqual('txid1');
      });
    });
  });

  describe('Function: rejectTx', () => {
    it('Should return the rejected txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };

      walletProvider.rejectTx(wallet, txp).then(rejectedTxp => {
        expect(rejectedTxp.txid).toEqual('txid1');
      });
    });
  });

  describe('Function: removeTx', () => {
    it('Should return the removed txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };

      walletProvider.removeTx(wallet, txp).then(() => {
        expect(wallet.cachedStatus.isValid).toBeFalsy();
      });
    });
  });

  describe('Function: updateRemotePreferences', () => {
    beforeEach(() => {
      const newOpts = {
        emailNotifications: {
          enabled: true,
          email: 'mail@mail.com'
        }
      };
      configProvider.set(newOpts);
    });

    it('Should update remote preferences with no errors', () => {
      const clients: WalletMock = new WalletMock();
      const prefs = {};

      walletProvider
        .updateRemotePreferences(clients, prefs)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: recreate', () => {
    it('Should recreate and change notAuthorized property to false', () => {
      const wallet: WalletMock = new WalletMock();

      walletProvider.recreate(wallet).then(() => {
        expect(wallet.notAuthorized).toBeFalsy();
      });
    });
  });

  describe('Function: startScan', () => {
    it('Should start scanning', () => {
      const wallet: WalletMock = new WalletMock();

      walletProvider.startScan(wallet).then(() => {
        expect(wallet.scanning).toBeTruthy();
      });
    });
  });

  describe('Function: clearTxHistory', () => {
    it('Should clean cached data and call removeTxHistory', () => {
      const wallet: WalletMock = new WalletMock();

      walletProvider.clearTxHistory(wallet);
      expect(wallet.cachedStatus.isValid).toBeFalsy();
    });
  });

  describe('Function: expireAddress', () => {
    it('Should work and call clearLastAddress', () => {
      const wallet: WalletMock = new WalletMock();

      walletProvider.expireAddress(wallet).catch(err => {
        expect(err).toBeDefined();
      });
    });
  });

  describe('Function: getMainAddresses', () => {
    it('Should call getMainAddresses and get main addresses', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      walletProvider.getMainAddresses(wallet, opts).then(addresses => {
        expect(addresses).toEqual([
          {
            address: 'address1'
          },
          {
            address: 'address2'
          }
        ]);
      });
    });
  });

  describe('Function: getBalance', () => {
    it('Should call getBalance and get the balance', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      walletProvider.getBalance(wallet, opts).then(balance => {
        expect(balance).toEqual({
          totalAmount: 1000
        });
      });
    });
  });

  describe('Function: getLowUtxos', () => {
    it('Should get the low utxos', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider.getLowUtxos(wallet).then(lowUtxos => {
        expect(lowUtxos).toEqual({
          allUtxos: [
            { satoshis: 1000 },
            { satoshis: 2000 },
            { satoshis: 3000 },
            { satoshis: 9000000 }
          ],
          lowUtxos: [
            { satoshis: 1000 },
            { satoshis: 2000 },
            { satoshis: 3000 }
          ],
          totalLow: 6000,
          warning: false,
          minFee: 3150
        });
      });
    });
  });

  describe('Function: encrypt', () => {
    const wallet: WalletMock = new WalletMock();

    it('Should call askPassword to encrypt wallet', () => {
      const spyAskPassword = spyOn<any>(
        walletProvider,
        'askPassword'
      ).and.returnValue(Promise.resolve('password1'));
      walletProvider.encrypt(wallet);
      expect(spyAskPassword).toHaveBeenCalled();
    });

    it('Should reject the promise if password is an empty string', () => {
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('')
      );
      walletProvider.encrypt(wallet).catch(msg => {
        expect(msg).toBeDefined(); // 'No password'
      });
    });
  });

  describe('Function: decrypt', () => {
    const wallet: WalletMock = new WalletMock();

    it('Should call askPassword to decrypt wallet', () => {
      const spyAskPassword = spyOn<any>(
        walletProvider,
        'askPassword'
      ).and.returnValue(Promise.resolve('password1'));
      walletProvider.decrypt(wallet);
      expect(spyAskPassword).toHaveBeenCalled();
    });

    it('Should reject the promise if password is an empty string', () => {
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('')
      );
      walletProvider.decrypt(wallet).catch(msg => {
        expect(msg).toBeDefined();
      });
    });
  });

  describe('Function: handleEncryptedWallet', () => {
    const wallet: WalletMock = new WalletMock();

    it('Should call askPassword', () => {
      const spyAskPassword = spyOn<any>(
        walletProvider,
        'askPassword'
      ).and.returnValue(Promise.resolve('password1'));
      walletProvider.handleEncryptedWallet(wallet).then(pass => {
        expect(pass).toEqual('password1');
      });
      expect(spyAskPassword).toHaveBeenCalled();
    });

    it('Should reject the promise if password is an empty string', () => {
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('')
      );
      walletProvider.handleEncryptedWallet(wallet).catch(msg => {
        expect(msg).toBeDefined();
      });
    });
  });

  describe('Function: reject', () => {
    const wallet: WalletMock = new WalletMock();
    const txp = {
      txid: 'txid1'
    };

    it('Should reject the txp', () => {
      walletProvider.reject(wallet, txp).then(rejectedTxp => {
        expect(rejectedTxp.txid).toEqual('txid1');
      });
    });
  });

  describe('Function: onlyPublish', () => {
    const wallet: WalletMock = new WalletMock();
    const txp = {
      txid: 'txid1'
    };

    it('Should publish the txp', () => {
      walletProvider.onlyPublish(wallet, txp).then(() => {
        expect(wallet.cachedStatus.isValid).toBeFalsy();
      });
    });
  });

  describe('Function: prepare', () => {
    const wallet: WalletMock = new WalletMock();

    it('Should call touchidProvider and then handleEncryptedWallet', () => {
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn(touchidProvider, 'checkWallet').and.returnValue(Promise.resolve());
      walletProvider.prepare(wallet).then(pass => {
        expect(pass).toEqual('password1');
      });
    });
  });

  describe('Function: publishAndSign', () => {
    const wallet: WalletMock = new WalletMock();
    let txp;

    it('Should prepare, sign and broadcast the txp if the status is pending', () => {
      txp = {
        txid: 'txid1',
        status: 'pending'
      };
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('password1')
      );
      walletProvider.publishAndSign(wallet, txp).then(broadcastedTxp => {
        expect(broadcastedTxp).toEqual(txp);
      });
    });

    it('Should prepare, publish, sign and broadcast the txp if the status is accepted', () => {
      txp = {
        txid: 'txid1',
        status: 'accepted'
      };
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('password1')
      );
      walletProvider.publishAndSign(wallet, txp).then(broadcastedTxp => {
        expect(broadcastedTxp).toEqual(txp);
      });
    });
  });

  describe('Function: getEncodedWalletInfo', () => {
    const wallet: WalletMock = new WalletMock();
    let pass;
    wallet.credentials.network = 'livenet';
    wallet.credentials.mnemonicHasPassphrase = false;

    it('Should get the encoded wallet info for a BIP44 wallet', () => {
      pass = 'password1';
      wallet.credentials.derivationStrategy = 'BIP44';
      wallet.credentials.getBaseAddressDerivationPath = () => "m/44'/0'/0'";

      walletProvider.getEncodedWalletInfo(wallet, pass).then(walletInfo => {
        expect(walletInfo).toEqual(
          "1|mom mom mom mom mom mom mom mom mom mom mom mom|livenet|m/44'/0'/0'|false|btc"
        );
      });
    });

    it('Should get the encoded wallet info for a BIP44 wallet without mnemonics', () => {
      pass = 'password2';
      wallet.credentials.derivationStrategy = 'BIP44';
      wallet.credentials.getBaseAddressDerivationPath = () => "m/44'/0'/0'";

      walletProvider.getEncodedWalletInfo(wallet, pass).then(walletInfo => {
        expect(walletInfo).toEqual("2|xPrivKey1|livenet|m/44'/0'/0'|false|btc");
      });
    });

    it('Should be reject for a BIP45 wallet', () => {
      pass = 'password1';
      wallet.credentials.derivationStrategy = 'BIP45';
      wallet.credentials.getBaseAddressDerivationPath = () => "m/45'/0'/0'";

      walletProvider.getEncodedWalletInfo(wallet, pass).catch(err => {
        expect(err).toBeDefined();
      });
    });
  });

  describe('Function: getKeysWithPassword', () => {
    const wallet: WalletMock = new WalletMock();
    let pass;

    it('Should get the keys of a wallet', () => {
      pass = 'password1';

      const keys = walletProvider.getKeysWithPassword(wallet, pass);
      expect(keys).toEqual({
        mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        xPrivKey: 'xPrivKey1'
      });
    });
  });

  describe('Function: setTouchId', () => {
    const wallet: WalletMock = new WalletMock();
    const enabled = true;

    it('Should set config options to enable touchId', () => {
      spyOn(touchidProvider, 'checkWallet').and.returnValue(Promise.resolve());
      const spySet = spyOn(configProvider, 'set');
      walletProvider
        .setTouchId([].concat(wallet), enabled)
        .then(() => {
          expect(spySet).toHaveBeenCalledWith({
            touchIdFor: {
              walletid1: true
            }
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getKeys', () => {
    const wallet: WalletMock = new WalletMock();

    it('Should get the keys of a wallet', () => {
      spyOn<any>(walletProvider, 'askPassword').and.returnValue(
        Promise.resolve('password1')
      );
      walletProvider.getKeys(wallet).then(keys => {
        expect(keys).toEqual({
          mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
          xPrivKey: 'xPrivKey1'
        });
      });
    });
  });

  describe('Function: getSendMaxInfo', () => {
    const wallet: WalletMock = new WalletMock();
    const opts = {};

    it('Should get the send max info of a wallet', () => {
      walletProvider.getSendMaxInfo(wallet, opts).then(sendMaxInfo => {
        expect(sendMaxInfo).toEqual(sendMaxInfoMock);
      });
    });
  });

  describe('Function: getProtocolHandler', () => {
    it('Should return bitcoincash if coin is bch and network is livenet', () => {
      const coin = 'bch';
      const network = 'livenet';
      const protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bitcoincash');
    });

    it('Should return bchtest if coin is bch and network is testnet', () => {
      const coin = 'bch';
      const network = 'testnet';
      const protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bchtest');
    });

    it('Should return bitcoin if coin is btc', () => {
      const coin = 'btc';
      const protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    });
  });

  describe('Function: copyCopayers', () => {
    const wallet: WalletMock = new WalletMock();
    wallet.credentials.publicKeyRing = [
      {
        copayerName: 'copayer1',
        xPubKey: 'xPubKey1',
        requestPubKey: 'requestPubKey1'
      },
      {
        copayerName: 'copayer2',
        xPubKey: 'xPubKey2',
        requestPubKey: 'requestPubKey2'
      }
    ];
    wallet.credentials.walletPrivKey = 'walletPrivKey1';
    const newWallet: WalletMock = new WalletMock();

    it('Should work without errors', () => {
      (walletProvider as any).bwcProvider.getBitcore = () => {
        const bitcore = {
          PrivateKey: {
            fromString: (walletPrivKey: string) => walletPrivKey
          }
        };
        return bitcore;
      };
      walletProvider
        .copyCopayers(wallet, newWallet)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });
});
