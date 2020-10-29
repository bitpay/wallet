import { TestUtils } from '../../test';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { ConfigProvider } from '../config/config';
import { Coin } from '../currency/currency';
import { FeeProvider } from '../fee/fee';
import { KeyProvider } from '../key/key';
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
  let keyProvider: KeyProvider;

  class PersistenceProviderMock {
    constructor() {}
    getLastAddress() {
      return Promise.resolve('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');
    }
    storeLastAddress(_, address) {
      return Promise.resolve(address);
    }
    fetchTxHistory(_walletId: string) {
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
    getTxHistory(_walletId: string) {
      return Promise.resolve(txsFromLocal);
    }
    getKeys() {
      return Promise.resolve([
        {
          id: 'keyId1',
          xPrivKey: 'xPrivKey1',
          version: 1,
          mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
          mnemonicHasPassphrase: false
        },
        {
          id: 'keyId2',
          xPrivKey: 'xPrivKey2',
          version: 1,
          mnemonicHasPassphrase: false
        }
      ]);
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
    keyProvider = testBed.get(KeyProvider);

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

  describe('Function: fetchStatus', () => {
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
      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          expect(status).toEqual(expectedStatus);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should get the status from a wallet that already have cachedStatus and pendingTxps, without opts', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const pendingTxp: PendingTxpMock = new PendingTxpMock();

      wallet.cachedStatus.pendingTxps = [pendingTxp];
      const expectedStatus = wallet.cachedStatus;
      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          expect(status).toEqual(expectedStatus);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should get tx.pendingForUs as true if tx.status is pending', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      const pendingTxp: PendingTxpMock = new PendingTxpMock();

      pendingTxp.status = 'pending';
      wallet.cachedStatus.pendingTxps = [pendingTxp];
      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          expect(status.pendingTxps[0].pendingForUs).toBeTruthy();
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          expect(status.pendingTxps[0].statusForUs).toEqual('accepted');
          expect(status.pendingTxps[1].statusForUs).toEqual('rejected');
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          delete status['statusUpdatedOn'];
          delete expectedStatus['statusUpdatedOn'];
          expect(status).toEqual(expectedStatus);
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .fetchStatus(wallet, opts)
        .then(status => {
          delete status['statusUpdatedOn'];
          expect(status).toEqual(expectedStatus);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getAddressView', () => {
    it('should get the correct address with protocol format for BCH testnet', () => {
      spyOn(txFormatProvider, 'toCashAddress').and.returnValue(
        'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass'
      );

      const address = walletProvider.getAddressView(
        Coin.BCH,
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
        Coin.BCH,
        'livenet',
        'qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
      );
      expect(address).toEqual(
        'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
      );
    });

    it("should return the same address if it isn't BCH", () => {
      const address = walletProvider.getAddressView(
        Coin.BTC,
        'livenet',
        '3DTdZeycDBaimjuuknVGrG8fxdLbjsAjXN'
      );
      expect(address).toEqual('3DTdZeycDBaimjuuknVGrG8fxdLbjsAjXN');
    });
  });

  describe('Function: getAddress', () => {
    it('should get the last address stored', () => {
      const wallet: WalletMock = new WalletMock();
      const force = false;
      walletProvider
        .getAddress(wallet, force)
        .then(address => {
          expect(address).toEqual('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');
        })
        .catch(err => {
          expect(err).toBeUndefined();
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
      walletProvider
        .getAddress(wallet, force)
        .then(address => {
          expect(address).toEqual('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');
        })
        .catch(err => {
          expect(err).toBeUndefined();
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
      walletProvider
        .getAddress(wallet, force)
        .then(mainAddress => {
          expect(mainAddress).toEqual('address1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
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
      walletProvider
        .getLowAmount(wallet)
        .then(fee => {
          expect(fee).toEqual(16400);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should approx utxo amount, from which the uxto is economically redeemable for a 2-2 wallet', () => {
      const wallet: WalletMock = new WalletMock();
      wallet.network = 'livenet';
      wallet.credentials.addressType = 'P2SH';
      wallet.m = 2;
      wallet.n = 2;
      walletProvider
        .getLowAmount(wallet)
        .then(fee => {
          expect(Math.floor(fee)).toEqual(24066);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getTxNote', () => {
    it('Should wallet.getTxNote and get the note of a particular tx', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider
        .getTxNote(wallet, 'txid')
        .then(note => {
          expect(note).toEqual('Note');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: editTxNote', () => {
    it('Should call wallet.editTxNote', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider
        .editTxNote(wallet, 'txid')
        .then(note => {
          expect(note).toEqual('NoteEdited');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getTxp', () => {
    it('Should call wallet.getTx and get the txp', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider
        .getTxp(wallet, 'txpid')
        .then(txp => {
          expect(txp).toEqual({
            txid: 'txid'
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
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
      wallet.completeHistoryIsValid = true;
      walletProvider
        .getTx(wallet, 'txid1')
        .then(tx => {
          expect(tx).toEqual({
            amount: 10000,
            fees: 99,
            txid: 'txid1'
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
      walletProvider.getTx(wallet, 'txid3').catch(err => {
        expect(err).toBeDefined();
      });
    });

    it("Should get the tx info if wallet hasn't a completeHistory", () => {
      const wallet: WalletMock = new WalletMock();

      spyOn(walletProvider, 'fetchTxHistory').and.returnValue(
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

      walletProvider
        .getTx(wallet, 'txid1')
        .then(tx => {
          expect(tx).toEqual({
            amount: 10000,
            fees: 99,
            txid: 'txid1'
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: fetchTxHistory', () => {
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
      wallet.completeHistoryIsValid = true;
      const opts = null;
      const progressFn = null;
      walletProvider
        .fetchTxHistory(wallet, progressFn, opts)
        .then(txHistory => {
          expect(txHistory).toEqual(wallet.completeHistory);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("Should return the completeHistory if isn't cached", () => {
      const wallet: WalletMock = new WalletMock();
      const opts = null;
      const progressFn = null;
      const expectedTxHistory = txsFromLocal;

      walletProvider
        .fetchTxHistory(wallet, progressFn, opts)
        .then(txHistory => {
          expect(wallet.completeHistoryIsValid).toBeTruthy();
          expect(txHistory).toEqual(expectedTxHistory);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: createTx', () => {
    it('Should return the complete txp', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000
      };

      walletProvider
        .createTx(wallet, txp)
        .then(createdTxp => {
          expect(createdTxp.outputs).toBeDefined();
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .publishTx(wallet, txp)
        .then(publishedTxp => {
          expect(publishedTxp.txid).toEqual('txid1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: signTx', () => {
    it('Should return the signed txid', async () => {
      await keyProvider.load();
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        coin: 'btc',
        amount: 10000
      };
      const pass = 'password';
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );

      walletProvider
        .signTx(wallet, txp, pass)
        .then(signedTxp => {
          expect(signedTxp.txid).toEqual('txid1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should return an ethereum txp with signed rawTx', async () => {
      await keyProvider.load();
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        coin: 'eth',
        amount: 10000
      };
      const pass = 'password';
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );

      walletProvider
        .signTx(wallet, txp, pass)
        .then(signedTxp => {
          expect(signedTxp).toBeDefined();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: broadcastTx', () => {
    it('Should return the broadcasted txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000,
        coin: 'btc',
        status: 'accepted'
      };

      walletProvider
        .broadcastTx(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp.txid).toEqual('txid1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should return the broadcasted ethereum txid', () => {
      const wallet: WalletMock = new WalletMock();
      const txp = {
        txid: 'txid1',
        amount: 10000,
        coin: 'eth',
        status: 'accepted'
      };

      walletProvider
        .broadcastTx(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp.txid).toEqual('txid1');
          expect(broadcastedTxp).toEqual(txp);
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .rejectTx(wallet, txp)
        .then(rejectedTxp => {
          expect(rejectedTxp.txid).toEqual('txid1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider
        .removeTx(wallet, txp)
        .then(() => {
          expect(wallet.cachedStatus.isValid).toBeFalsy();
        })
        .catch(err => {
          expect(err).toBeUndefined();
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
      spyOn(configProvider, 'get').and.returnValue(newOpts);
    });

    it('Should update remote preferences with no errors', () => {
      const clients: WalletMock = new WalletMock();

      walletProvider
        .updateRemotePreferences(clients)
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

      walletProvider
        .recreate(wallet)
        .then(() => {
          expect(wallet.notAuthorized).toBeFalsy();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: startScan', () => {
    it('Should start scanning', () => {
      const wallet: WalletMock = new WalletMock();

      walletProvider
        .startScan(wallet)
        .then(() => {
          expect(wallet.scanning).toBeTruthy();
        })
        .catch(err => {
          expect(err).toBeUndefined();
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

      walletProvider.expireAddress(wallet.id).catch(err => {
        expect(err).toBeDefined();
      });
    });
  });

  describe('Function: getMainAddresses', () => {
    it('Should call getMainAddresses and get main addresses', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      walletProvider
        .getMainAddresses(wallet, opts)
        .then(addresses => {
          expect(addresses).toEqual([
            {
              address: 'address1'
            },
            {
              address: 'address2'
            }
          ]);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getBalance', () => {
    it('Should call getBalance and get the balance', () => {
      const wallet: WalletMock = new WalletMock();
      const opts = {};
      walletProvider
        .getBalance(wallet, opts)
        .then(balance => {
          expect(balance).toEqual({
            totalAmount: 1000
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getLowUtxos', () => {
    it('Should get the low utxos', () => {
      const wallet: WalletMock = new WalletMock();
      walletProvider
        .getLowUtxos(wallet)
        .then(lowUtxos => {
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
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: reject', () => {
    const wallet: WalletMock = new WalletMock();
    const txp = {
      txid: 'txid1'
    };

    it('Should reject the txp', () => {
      walletProvider
        .reject(wallet, txp)
        .then(rejectedTxp => {
          expect(rejectedTxp.txid).toEqual('txid1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: onlyPublish', () => {
    const wallet: WalletMock = new WalletMock();
    const txp = {
      txid: 'txid1'
    };

    it('Should publish the txp', () => {
      walletProvider
        .onlyPublish(wallet, txp)
        .then(() => {
          expect(wallet.cachedStatus.isValid).toBeFalsy();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: prepare', () => {
    it('Should call touchidProvider and then handleEncryptedWallet', async () => {
      const wallet: WalletMock = new WalletMock();
      await keyProvider.load();
      spyOn(keyProvider, 'handleEncryptedWallet').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn(touchidProvider, 'checkWallet').and.returnValue(Promise.resolve());
      walletProvider
        .prepare(wallet)
        .then(pass => {
          expect(pass).toEqual('password1');
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: publishAndSign', () => {
    const wallet: WalletMock = new WalletMock();
    let txp;
    it('Should prepare, sign and broadcast the txp if the status is pending', async () => {
      await keyProvider.load();
      txp = {
        txid: 'txid1',
        coin: 'btc',
        status: 'pending'
      };
      spyOn(keyProvider, 'handleEncryptedWallet').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );
      walletProvider
        .publishAndSign(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp).toEqual(txp);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should prepare, sign and broadcast ethereum txp if the status is pending', async () => {
      await keyProvider.load();
      txp = {
        txid: 'txid1',
        coin: 'eth',
        status: 'pending'
      };
      spyOn(keyProvider, 'handleEncryptedWallet').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );
      walletProvider
        .publishAndSign(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp).toBeDefined();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should prepare, publish, sign and broadcast the txp if the status is accepted', async () => {
      await keyProvider.load();

      txp = {
        txid: 'txid1',
        coin: 'btc',
        status: 'accepted'
      };
      spyOn(keyProvider, 'handleEncryptedWallet').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );
      walletProvider
        .publishAndSign(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp).toEqual(txp);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should prepare, publish, sign and broadcast ethereum txp if the status is accepted', async () => {
      await keyProvider.load();

      txp = {
        txid: 'txid1',
        coin: 'eth',
        status: 'accepted'
      };
      spyOn(keyProvider, 'handleEncryptedWallet').and.returnValue(
        Promise.resolve('password1')
      );
      spyOn<any>(keyProvider, 'sign').and.returnValue(
        Promise.resolve('signatures')
      );
      walletProvider
        .publishAndSign(wallet, txp)
        .then(broadcastedTxp => {
          expect(broadcastedTxp).toBeDefined();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getEncodedWalletInfo', () => {
    const wallet: WalletMock = new WalletMock();
    let pass;
    wallet.credentials.network = 'livenet';

    it('Should get the encoded wallet info for a BIP44 wallet', async () => {
      await keyProvider.load();
      pass = 'password1';
      spyOn<any>(keyProvider, 'getBaseAddressDerivationPath').and.returnValue(
        "m/44'/0'/0'"
      );

      walletProvider
        .getEncodedWalletInfo(wallet, pass)
        .then(walletInfo => {
          expect(walletInfo).toEqual(
            "1|mom mom mom mom mom mom mom mom mom mom mom mom|livenet|m/44'/0'/0'|false|btc"
          );
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should get the encoded wallet info for a BIP44 wallet without mnemonics', async () => {
      await keyProvider.load();
      pass = 'password2';
      spyOn<any>(keyProvider, 'getBaseAddressDerivationPath').and.returnValue(
        "m/44'/0'/0'"
      );
      wallet.credentials.keyId = 'keyId2';

      walletProvider
        .getEncodedWalletInfo(wallet, pass)
        .then(walletInfo => {
          expect(walletInfo).toEqual(
            "2|xPrivKey2|livenet|m/44'/0'/0'|false|btc"
          );
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('Should be reject for a BIP45 wallet', () => {
      pass = 'password1';
      spyOn<any>(keyProvider, 'getBaseAddressDerivationPath').and.returnValue(
        "m/44'/0'/0'"
      );

      walletProvider.getEncodedWalletInfo(wallet, pass).catch(err => {
        expect(err).toBeDefined();
      });
    });
  });

  describe('Function: getKeysWithPassword', () => {
    const wallet: WalletMock = new WalletMock();
    let pass;

    it('Should get the keys of a wallet', async () => {
      await keyProvider.load();
      pass = 'password1';

      const keys = walletProvider.getKeysWithPassword(wallet, pass);
      expect(keys).toEqual({
        mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        xPrivKey: 'xPrivKey1',
        mnemonicHasPassphrase: false
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

    it('Should get the keys of a wallet', async () => {
      await keyProvider.load();
      spyOn<any>(keyProvider, 'askPassword').and.returnValue(
        Promise.resolve('password1')
      );
      walletProvider
        .getKeys(wallet)
        .then(keys => {
          expect(keys).toEqual({
            mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
            xPrivKey: 'xPrivKey1',
            mnemonicHasPassphrase: false
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getSendMaxInfo', () => {
    const wallet: WalletMock = new WalletMock();
    const opts = {};

    it('Should get the send max info of a wallet', () => {
      walletProvider
        .getSendMaxInfo(wallet, opts)
        .then(sendMaxInfo => {
          expect(sendMaxInfo).toEqual(sendMaxInfoMock);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('Function: getProtocolHandler', () => {
    it('Should return bitcoincash if coin is bch and network is livenet', () => {
      const coin = Coin.BCH;
      const network = 'livenet';
      const protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bitcoincash');
    });

    it('Should return bchtest if coin is bch and network is testnet', () => {
      const coin = Coin.BCH;
      const network = 'testnet';
      const protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bchtest');
    });

    it('Should return bitcoin if coin is btc', () => {
      const coin = Coin.BTC;
      const protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    });
  });
});
