/* import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { BwcProvider, KeyProvider, PersistenceProvider } from '..';
import { TestUtils } from '../../test';

// Models
import { Profile } from '../../models/profile/profile.model';

// Providers
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ProfileProvider } from '../profile/profile';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';
import { TxFormatProvider } from '../tx-format/tx-format';

describe('Profile Provider', () => {
  let testBed;
  let events: Events;
  let eventsPublishSpy;
  let onEventNotificationType: string;
  let profileProvider: ProfileProvider;
  let actionSheetProvider: ActionSheetProvider;
  let configProvider: ConfigProvider;
  let keyProvider: KeyProvider;
  let popupProvider: PopupProvider;
  let replaceParametersProvider: ReplaceParametersProvider;
  let platformProvider: PlatformProvider;
  let txFormatProvider: TxFormatProvider;

  const walletMock = {
    id1: {
      id: 'id1',
      copayerId: 'copayerId1',
      lastKnownBalance: '10.00 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id1'
      },
      cachedStatus: {
        availableBalanceSat: 1000000000 // 10 BTC
      },
      needsBackup: false,
      order: '',
      pendingTxps: [
        {
          id: 'txpId1',
          createdOn: 1558382068661
        },
        {
          id: 'txpId2',
          createdOn: 1558386120369
        }
      ],
      isComplete: () => {
        return true;
      },
      setNotificationsInterval: _updatePeriod => {}
    },
    id2: {
      id: 'id2',
      copayerId: 'copayerId2',
      lastKnownBalance: '5.00 BCH',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'bch',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id2'
      },
      cachedStatus: {
        availableBalanceSat: 500000000 // 5 BCH
      },
      needsBackup: true,
      order: 2,
      pendingTxps: [
        {
          id: 'txpId3',
          createdOn: 1558386151162
        }
      ],
      isComplete: () => {
        return true;
      }
    },
    id3: {
      id: 'id3',
      copayerId: 'copayerId3',
      lastKnownBalance: '1.50 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        walletId: 'id3'
      },
      cachedStatus: {
        availableBalanceSat: 150000000 // 1.50 BTC
      },
      needsBackup: true,
      order: 3,
      pendingTxps: [],
      isComplete: () => {
        return true;
      }
    }
  };

  const walletToImport = {
    walletId: 'id1',
    xPrivKey: 'xPrivKey1',
    xPrivKeyEncrypted: 'xPrivKeyEncrypted1',
    mnemonicEncrypted: 'mnemonicEncrypted1',
    n: 1
  };

  const walletClientMock = {
    copayerId: 'copayerId1',
    credentials: {
      coin: 'btc',
      network: 'livenet',
      n: 1,
      m: 1,
      walletId: 'id1',
      keyId: 'keyId'
    },
    canSign: () => {
      return true;
    },
    encryptPrivateKey: () => {
      return true;
    },
    toString: (_opts?) => {
      return '{"walletId": "id1", "xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1", "n": 1}';
    },
    fromString: _key => {
      return true;
    },
    import: (_str: string, _opts) => {
      return true;
    },
    importFromExtendedPrivateKey: (_xPrivKey: string, _opts, _cb) => {
      return _cb(null, walletToImport);
    },
    importFromExtendedPublicKey: (
      _xPubKey: string,
      _externalSource: string,
      _entropySource: string,
      _opts,
      _cb
    ) => {
      return _cb(null, walletToImport);
    },
    importFromMnemonic: (_words: string, _opts, _cb) => {
      return _cb(null, walletToImport);
    },
    initialize: (_opts, _cb) => {
      return _cb(null);
    },
    isPrivKeyEncrypted: () => {
      return true;
    },
    removeAllListeners: () => {
      return true;
    },
    on: (_event: string, _cb) => {
      let n;
      switch (_event) {
        case 'report':
          n = 1;
          break;
        case 'notification':
          n = {
            data: {
              creatorId: 'creatorId1',
              amount: 100,
              network: 'livenet'
            },
            type: onEventNotificationType
          };
          break;
        case 'walletCompleted':
          n = undefined; // undefined
          break;
        default:
          n = null;
          break;
      }

      return _cb(n);
    },
    validateKeyDerivation: (_opts, _cb) => {
      return _cb(null, true);
    },
    seedFromRandomWithMnemonic: _opts => {
      return true;
    },
    seedFromExtendedPublicKey: (
      _extendedPublicKey: string,
      _externalSource: string,
      _entropySource: string,
      _opts
    ) => {
      return true;
    },
    createWallet: (
      _name: string,
      _myName: string,
      _m: number,
      _n: number,
      _opts,
      _cb
    ) => {
      return _cb(null);
    },
    joinWallet: (_secret: string, _myName: string, _opts, _cb) => {
      return _cb(null);
    },
    setNotificationsInterval: _updatePeriod => {
      return true;
    },
    openWallet: _function => {
      return;
    }
  };

  let genericKey = {
    id: 'keyId',
    xPrivKey: 'xPrivKey',
    encrypt: () => {
      return true;
    },
    createCredentials: (_, _opts) => {
      return true;
    },
    isPrivKeyEncrypted: () => {
      return false;
    },
    toObj: () => {
      return keysArrayFromStorage[0];
    }
  };

  let keysArrayFromStorage = [
    {
      id: 'keyId4',
      xPrivKey: 'xPrivKey4'
    },
    {
      id: 'keyId5',
      xPrivKey: 'xPrivKey5'
    },
    genericKey
  ];

  class BwcProviderMock {
    constructor() {}
    getErrors() {
      return {
        NOT_AUTHORIZED: new Error('not authorized'),
        ERROR: new Error('error')
      };
    }
    getBitcore() {
      return true;
    }
    getBitcoreCash() {
      return true;
    }
    getClient(_walletData, _opts) {
      return _.clone(walletClientMock);
    }
    getKey(_walletData, _opts) {
      return {
        create: _opts => {
          return genericKey;
        },
        fromExtendedPrivateKey: (_extendedPrivateKey: string, _opts) => {
          return genericKey;
        },
        fromMnemonic: (_mnemonic: string, _opts) => {
          return genericKey;
        },
        fromObj: _key => {
          let key = genericKey;
          return key;
        },
        match: (_key1, _key2) => {
          return false;
        }
      };
    }
    upgradeCredentialsV1(_data) {
      const migrated = {
        credentials: {
          walletId: 'id1',
          keyId: 'keyId1',
          m: 1,
          n: 1
        },
        key: {
          mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
          xPrivKey: 'xPrivKey1',
          isPrivKeyEncrypted: () => {
            return false;
          },
          toObj: () => {
            return false;
          }
        }
      };
      return migrated;
    }
    upgradeMultipleCredentialsV1(_oldCredentials) {
      const migrated = {
        credentials: {
          walletId: 'id1',
          keyId: 'keyId1',
          m: 1,
          n: 1
        },
        keys: {
          mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
          xPrivKey: 'xPrivKey1',
          isPrivKeyEncrypted: () => {
            return false;
          },
          toObj: () => {
            return false;
          }
        }
      };
      return migrated;
    }
    parseSecret(_secret) {
      let walletData;
      switch (_secret) {
        case 'secret1':
          walletData = {
            walletId: 'id1',
            network: 'livenet'
          };
          break;

        case 'secret5':
          walletData = {
            walletId: 'id5',
            network: 'livenet'
          };
          break;
      }
      return walletData;
    }
  }

  class PersistenceProviderMock {
    constructor() {}
    setBackupFlag(_walletId) {
      return Promise.resolve();
    }
    setWalletOrder() {
      return Promise.resolve();
    }
    getWalletOrder() {
      return Promise.resolve(1);
    }
    getHideBalanceFlag(_walletId) {
      return Promise.resolve(true);
    }
    storeProfileLegacy(_profileOld) {
      return Promise.resolve();
    }
    storeProfile(_profile) {
      return Promise.resolve();
    }
    getAddressBook(_network: string) {
      return Promise.resolve('{"name": "Gabriel Loco"}');
    }
    setAddressBook(_network: string, _strAddressBook: string) {
      return Promise.resolve();
    }
    storeNewProfile(_profile) {
      return Promise.resolve();
    }
    getCopayDisclaimerFlag() {
      return Promise.resolve(true);
    }
    getKeys() {
      return Promise.resolve(keysArrayFromStorage);
    }
    setKeys() {
      return Promise.resolve();
    }
    getProfile() {
      const profile = {
        createdOn: Date.now(),
        checkedUA: true
      };
      return Promise.resolve(profile);
    }
    removeAllWalletData(_walletId: string) {
      return;
    }
    getLastKnownBalance(_id: string) {
      let lastKnownBalance;
      switch (_id) {
        case 'id1':
          lastKnownBalance = {
            balance: '10.00 BTC',
            updatedOn: 1558382053803
          };
          break;

        case 'id2':
          lastKnownBalance = {
            balance: '5.00 BCH',
            updatedOn: 1558382068661
          };
          break;
        default:
          lastKnownBalance = {
            balance: '0.00 BTC',
            updatedOn: Date.now()
          };
          break;
      }
      return Promise.resolve(lastKnownBalance);
    }
    setHideBalanceFlag(_walletId: string, _balanceHidden: boolean) {
      return;
    }
  }

  beforeEach(async () => {
    testBed = TestUtils.configureProviderTestingModule([
      { provide: BwcProvider, useClass: BwcProviderMock },
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    profileProvider = testBed.get(ProfileProvider);
    actionSheetProvider = testBed.get(ActionSheetProvider);
    configProvider = testBed.get(ConfigProvider);
    keyProvider = testBed.get(KeyProvider);
    popupProvider = testBed.get(PopupProvider);
    replaceParametersProvider = testBed.get(ReplaceParametersProvider);
    platformProvider = testBed.get(PlatformProvider);
    txFormatProvider = testBed.get(TxFormatProvider);

    profileProvider.wallet = _.clone(walletMock);
    profileProvider.profile = Profile.create();

    events = testBed.get(Events);
    eventsPublishSpy = spyOn(events, 'publish');
    spyOn(events, 'subscribe').and.returnValue({
      walletId: 'id1'
    });

    await keyProvider.load();
  });

  describe('setWalletOrder', () => {
    it('should set the order if walletId already exists in wallet object', () => {
      const walletId: string = 'id1';
      const order: number = 1;
      profileProvider.setWalletOrder(walletId, order);
      expect(profileProvider.wallet.id1.order).toBeDefined();
      profileProvider.wallet.id1.order = order;
      expect(profileProvider.wallet.id1.order).toBe(1);
    });

    it("should not set the order if walletId doesn't exist in wallet object", () => {
      const walletId: string = 'id4';
      const order: number = 4;
      profileProvider.setWalletOrder(walletId, order);
      expect(profileProvider.wallet.id4).not.toBeDefined();
    });
  });

  describe('getWalletOrder', () => {
    it('should get the correct order from persistenceProvider if it is defined', () => {
      const walletId: string = 'id1';
      profileProvider.getWalletOrder(walletId).then(order => {
        expect(order).toBe(1);
      });
    });
  });

  describe('setBackupFlag', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const walletId: string = 'id3';
      profileProvider.setBackupFlag(walletId);
      expect(profileProvider.wallet.id3.needsBackup).toBeFalsy();
    });
  });

  describe('setFastRefresh', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const setNotificationsIntervalSpy = spyOn(
        profileProvider.wallet.id1,
        'setNotificationsInterval'
      );
      profileProvider.UPDATE_PERIOD_FAST = 5;
      profileProvider.setFastRefresh(profileProvider.wallet.id1);
      expect(setNotificationsIntervalSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('setSlowRefresh', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const setNotificationsIntervalSpy = spyOn(
        profileProvider.wallet.id1,
        'setNotificationsInterval'
      );
      profileProvider.UPDATE_PERIOD = 15;
      profileProvider.setSlowRefresh(profileProvider.wallet.id1);
      expect(setNotificationsIntervalSpy).toHaveBeenCalledWith(15);
    });
  });

  describe('updateCredentials', () => {
    it('should call the updateWallet method of profile to update credentials', () => {
      const updateWalletSpy = spyOn(profileProvider.profile, 'updateWallet');
      const credentials = profileProvider.wallet.id1.credentials;
      profileProvider.updateCredentials(credentials);

      expect(updateWalletSpy).toHaveBeenCalledWith(credentials);
    });
  });

  describe('storeProfileIfDirty', () => {
    it('should store the profile if it is dirty', async () => {
      profileProvider.profile.dirty = true;
      await profileProvider
        .storeProfileIfDirty()
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should not store the profile if it is not dirty', async () => {
      profileProvider.profile.dirty = false;
      await profileProvider
        .storeProfileIfDirty()
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('Function: normalizeMnemonic', () => {
    it('Should return the same input string if is called without words', () => {
      const words = '';
      expect(profileProvider.normalizeMnemonic(words)).toEqual('');
    });

    it('Should return the same words list if it is already normalized', () => {
      const words = 'mom mom mom mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with more than one space between words', () => {
      const words =
        'mom  mom mom           mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with spaces at the end of the phrase', () => {
      const words = 'mom mom mom mom mom mom mom mom mom mom mom mom    ';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with spaces at the beginning of the phrase', () => {
      const words = '     mom mom mom mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized with different capitalizations', () => {
      const words = 'Mom MOM mom mom mOm mom moM mom MOM mom Mom Mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized for all different languages if it is called with capital letters and spaces in different combinations of positions', () => {
      const words =
        '     mom  Mom mom           mom mom MOM mom moM mom mom mom mom    ';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );

      const spanishWords =
        ' tener golpe máquina   cumbre caÑón UNO lino Vigor RÁbano sombra oleada multa  ';
      expect(profileProvider.normalizeMnemonic(spanishWords)).toEqual(
        'tener golpe máquina cumbre cañón uno lino vigor rábano sombra oleada multa'
      );

      const frenchWords =
        '  effacer embryon groupe   rigide BUSTIER caresser adjectif colonel friable bolide terrible divertir  ';
      expect(profileProvider.normalizeMnemonic(frenchWords)).toEqual(
        'effacer embryon groupe rigide bustier caresser adjectif colonel friable bolide terrible divertir'
      );

      const italianWords =
        'AVERE   farfalla siccome balzano grinza dire baGnato fegato nomina satollo baldo nobile  ';
      expect(profileProvider.normalizeMnemonic(italianWords)).toEqual(
        'avere farfalla siccome balzano grinza dire bagnato fegato nomina satollo baldo nobile'
      );

      const dutchWords =
        'blush cube farm element maTH gauge defy install garden awkward wide fancy  ';
      expect(profileProvider.normalizeMnemonic(dutchWords)).toEqual(
        'blush cube farm element math gauge defy install garden awkward wide fancy'
      );

      const polishWords =
        ' spider  rose radio defense   garment voice kitten dune    license chunk   glove shuffle';
      expect(profileProvider.normalizeMnemonic(polishWords)).toEqual(
        'spider rose radio defense garment voice kitten dune license chunk glove shuffle'
      );

      const germanWords =
        'Harsh Original Stove Fortune Enforce Young Throw Clay Liberty Certain Loud Aware';
      expect(profileProvider.normalizeMnemonic(germanWords)).toEqual(
        'harsh original stove fortune enforce young throw clay liberty certain loud aware'
      );

      const japaneseWords =
        '  のぼる　しゅみ　ぜっく　おおどおり　 そんしつ　はさん　けつえき　くうき　こんき　ひやす　うよく　しらせる   ';
      expect(profileProvider.normalizeMnemonic(japaneseWords)).toEqual(
        'のぼる　しゅみ　ぜっく　おおどおり　そんしつ　はさん　けつえき　くうき　こんき　ひやす　うよく　しらせる'
      );

      const simplifiedChineseWords = '  泰 柱 腹 侵 米 强 隙 学 良  迅 使 毕 ';
      expect(profileProvider.normalizeMnemonic(simplifiedChineseWords)).toEqual(
        '泰 柱 腹 侵 米 强 隙 学 良 迅 使 毕'
      );

      const traditionalChineseWords =
        ' 只 沒 結 解 問 意   建 月  公 無 系 軍 ';
      expect(
        profileProvider.normalizeMnemonic(traditionalChineseWords)
      ).toEqual('只 沒 結 解 問 意 建 月 公 無 系 軍');

      const russianWords =
        'proud admit  enforce  fruit  prosper  odor approve present have there smart kitten ';
      expect(profileProvider.normalizeMnemonic(russianWords)).toEqual(
        'proud admit enforce fruit prosper odor approve present have there smart kitten'
      );

      const portugueseWords =
        'ABSENT POND DEPOSIT SMOOTH EMPTY TROPHY LOUD THERE ADMIT WHISPER MULE MORE';
      expect(profileProvider.normalizeMnemonic(portugueseWords)).toEqual(
        'absent pond deposit smooth empty trophy loud there admit whisper mule more'
      );
    });
  });

  describe('createProfile', () => {
    it('should call storeNewProfile function with the new profile', () => {
      const storeNewProfileSpy = spyOn(
        PersistenceProviderMock.prototype,
        'storeNewProfile'
      );

      profileProvider.createProfile();

      expect(storeNewProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
    });
  });

  describe('bindProfile', () => {
    it('should work without errors if disclaimerAccepted', async () => {
      const profile = {
        credentials: [
          profileProvider.wallet.id1.credentials,
          profileProvider.wallet.id2.credentials
        ]
      };

      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      profileProvider.profile.disclaimerAccepted = true;

      await profileProvider
        .bindProfile(profile)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('isDisclaimerAccepted', () => {
    it('should return promise resolve if disclaimerAccepted is true', () => {
      profileProvider.profile.disclaimerAccepted = true;

      profileProvider
        .isDisclaimerAccepted()
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should set disclaimerAccepted with true', () => {
      profileProvider.profile.disclaimerAccepted = false;

      profileProvider
        .isDisclaimerAccepted()
        .then(() => {
          expect(profileProvider.profile.disclaimerAccepted).toBeTruthy();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('loadAndBindProfile', () => {
    it('should get, bind and return profile', () => {
      const bindProfileSpy = spyOn(
        profileProvider,
        'bindProfile'
      ).and.returnValue(Promise.resolve());

      profileProvider
        .loadAndBindProfile()
        .then(profile => {
          expect(profile).toBeDefined();
          expect(bindProfileSpy).toHaveBeenCalledWith(profile);
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should return error if bindProfile fails', () => {
      spyOn(profileProvider, 'bindProfile').and.returnValue(
        Promise.reject('Error')
      );

      profileProvider
        .loadAndBindProfile()
        .then(profile => {
          expect(profile).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });
  });

  describe('createWallet', () => {
    it('should create wallet using seedFromMnemonic', () => {
      const opts = {
        name: 'walletName',
        m: 1,
        n: 1,
        myName: null,
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc',
        mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom'
      };

      profileProvider
        .createWallet(opts)
        .then(walletClient => {
          expect(walletClient).toBeDefined();
          expect(walletClient.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should create wallet using seedFromExtendedPrivateKey', () => {
      const opts = {
        name: 'walletName',
        m: 1,
        n: 1,
        myName: null,
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc',
        extendedPrivateKey: 'extendedPrivateKey1'
      };

      profileProvider
        .createWallet(opts)
        .then(walletClient => {
          expect(walletClient).toBeDefined();
          expect(walletClient.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should create wallet using seedFromExtendedPublicKey', () => {
      const opts = {
        name: 'walletName',
        m: 1,
        n: 1,
        myName: null,
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc',
        extendedPublicKey: 'extendedPublicKey1'
      };

      profileProvider
        .createWallet(opts)
        .then(walletClient => {
          expect(walletClient).toBeDefined();
          expect(walletClient.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should create wallet using FromRandomWithMnemonic', () => {
      const opts = {
        name: 'walletName',
        m: 1,
        n: 1,
        myName: null,
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc'
      };

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );

      profileProvider
        .createWallet(opts)
        .then(walletClient => {
          expect(walletClient).toBeDefined();
          expect(walletClient.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('joinWallet', () => {
    beforeEach(() => {
      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);
    });

    it('should join wallet and publish "Local/WalletListChange" event', async () => {
      const opts = {
        secret: 'secret5',
        coin: 'btc',
        myName: 'Gabriel M'
      };

      await profileProvider
        .joinWallet(opts)
        .then(wallet => {
          expect(wallet).toBeDefined();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });

    it('should fails to join wallet if you already joined that wallet', async () => {
      const opts = {
        secret: 'secret1',
        coin: 'btc',
        myName: 'Gabriel M'
      };

      profileProvider.profile.credentials = [
        {
          walletId: 'id1'
        }
      ];

      await profileProvider
        .joinWallet(opts)
        .then(wallet => {
          expect(wallet).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });
  });

  describe('getWallet', () => {
    beforeEach(() => {
      profileProvider.wallet = {
        id1: {
          id: 'id1'
        },
        id2: {
          id: 'id2'
        }
      };
    });
    it('should get the correct wallet', () => {
      const walletId = 'id1';
      const wallet = profileProvider.getWallet(walletId);
      expect(wallet).toEqual(profileProvider.wallet.id1);
    });

    it('should get undefined if provided walletId does not match with any wallet', () => {
      const walletId = 'id3';
      const wallet = profileProvider.getWallet(walletId);
      expect(wallet).toBeUndefined();
    });
  });

  describe('deleteWalletClient', () => {
    beforeEach(() => {
      profileProvider.wallet = {
        id1: {
          id: 'id1'
        },
        id2: {
          id: 'id2'
        }
      };
    });
    it('should delete wallet client', async () => {
      const wallet = {
        credentials: {
          walletId: 'id1'
        },
        removeAllListeners: () => {}
      };
      spyOn(profileProvider.profile, 'deleteWallet').and.returnValue(false);

      await profileProvider
        .deleteWalletClient(wallet)
        .then(() => {
          expect(profileProvider.wallet).toEqual({
            id2: {
              id: 'id2'
            }
          });
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });

      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });
  });

  describe('setDisclaimerAccepted', () => {
    it('should set disclaimerAccepted with true', () => {
      profileProvider
        .setDisclaimerAccepted()
        .then(() => {
          expect(profileProvider.profile.disclaimerAccepted).toBeTruthy();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('setLastKnownBalance', () => {
    it('should set the last known balance', () => {
      profileProvider.setLastKnownBalance();
      expect(profileProvider.wallet.id1.lastKnownBalance).toBeDefined();
    });
  });

  describe('getWallets', () => {
    it('should get successfully all wallets when no opts', () => {
      const wallets = profileProvider.getWallets();
      expect(wallets).toEqual(_.values(profileProvider.wallet));
    });

    it('should get successfully all wallets when opts are provided', () => {
      const opts = {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        hasFunds: true,
        minAmount: 0,
        onlyComplete: true
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([profileProvider.wallet.id3]);
    });

    it('should not return any wallet when there is no wallets validating provided opts', () => {
      const opts = {
        coin: 'bch',
        network: 'livenet',
        minAmount: 1000000000
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([]);
    });
  });

  describe('toggleHideBalanceFlag', () => {
    it('should toggle the balanceHidden flag', () => {
      const walletId = 'id1';
      profileProvider.wallet.id1.balanceHidden = false;
      profileProvider.toggleHideBalanceFlag(walletId);
      expect(profileProvider.wallet.id1.balanceHidden).toBeTruthy();
      profileProvider.toggleHideBalanceFlag(walletId);
      expect(profileProvider.wallet.id1.balanceHidden).toBeFalsy();
    });
  });

  describe('getTxps', () => {
    it('should get all txps', () => {
      const opts = {};
      profileProvider
        .getTxps(opts)
        .then(txpsData => {
          expect(txpsData.txps).toEqual([
            {
              id: 'txpId3',
              createdOn: 1558386151162
            },
            {
              id: 'txpId2',
              createdOn: 1558386120369
            },
            {
              id: 'txpId1',
              createdOn: 1558382068661
            }
          ]);
          expect(txpsData.n).toEqual(3);
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('Desktop notifications', () => {
    let opts;

    beforeEach(() => {
      (window as any).require = () => {
        return {
          ipcRenderer: {
            send: (_type: string, _opts) => {
              return true;
            }
          }
        };
      };

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );

      spyOn(configProvider, 'get').and.returnValue({
        bwsFor: 'id1',
        desktopNotificationsEnabled: true
      });

      spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue({
        present: () => {
          return true;
        },
        dismiss: () => {
          return true;
        }
      });

      spyOn(Observable, 'timer').and.returnValue({
        toPromise: () => {
          return true;
        }
      });

      platformProvider.isElectron = true; // To specifies that is desktop

      opts = {
        name: 'walletName',
        m: 1,
        n: 1,
        myName: null,
        networkName: 'livenet',
        bwsurl: 'https://bws.bitpay.com/bws/api',
        singleAddress: false,
        coin: 'btc',
        mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom'
      };
    });

    it('should call showDesktopNotifications and go through NewCopayer path for MacOS', async () => {
      spyOn(platformProvider, 'getOS').and.returnValue({
        OSName: 'MacOS'
      });

      onEventNotificationType = 'NewCopayer';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through NewCopayer path for other OS', async () => {
      spyOn(platformProvider, 'getOS').and.returnValue({
        OSName: 'Linux'
      });

      onEventNotificationType = 'NewCopayer';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through WalletComplete path', async () => {
      onEventNotificationType = 'WalletComplete';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through NewTxProposal path', async () => {
      let newWalletClient = _.clone(walletClientMock);
      newWalletClient.copayerId = 'copayerId1';
      newWalletClient.credentials.m = 2;
      newWalletClient.credentials.n = 2;

      spyOn(BwcProviderMock.prototype, 'getClient').and.returnValue(
        newWalletClient
      );

      onEventNotificationType = 'NewTxProposal';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through NewIncomingTx path', async () => {
      onEventNotificationType = 'NewIncomingTx';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      spyOn(txFormatProvider, 'formatAmountStr').and.returnValue('5.00 BTC');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through TxProposalFinallyRejected path', async () => {
      onEventNotificationType = 'TxProposalFinallyRejected';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });

    it('should call showDesktopNotifications and go through TxConfirmation path', async () => {
      onEventNotificationType = 'TxConfirmation';
      const replaceSpy = spyOn(
        replaceParametersProvider,
        'replace'
      ).and.returnValue('body1');

      // Using createWallet just to test showDesktopNotifications private function
      await profileProvider.createWallet(opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });
  });
});
 */
