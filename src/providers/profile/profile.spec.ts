import { Events } from 'ionic-angular';
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
import { ProfileProvider } from '../profile/profile';
import { RateProvider } from '../rate/rate';
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
  let replaceParametersProvider: ReplaceParametersProvider;
  let platformProvider: PlatformProvider;
  let txFormatProvider: TxFormatProvider;
  let persistenceProvider: PersistenceProvider;

  const walletMock = {
    id1: {
      id: 'id1',
      coin: 'btc',
      copayerId: 'copayerId1',
      lastKnownBalance: '10.00 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id1',
        rootPath: "m/44'/0'/0'",
        addressType: 'P2PKH',
        keyId: 'keyId1'
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
      coin: 'btc',
      copayerId: 'copayerId2',
      lastKnownBalance: '5.00 BCH',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'bch',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id2',
        rootPath: "m/44'/0'/0'",
        addressType: 'P2PKH',
        keyId: 'keyId2'
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
      coin: 'btc',
      copayerId: 'copayerId3',
      lastKnownBalance: '1.50 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        walletId: 'id3',
        rootPath: "m/44'/0'/0'",
        addressType: 'P2PKH',
        keyId: 'keyId1'
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
    toObj: () => ({
      walletId: 'id1',
      xPrivKey: 'xPrivKey1',
      xPrivKeyEncrypted: 'xPrivKeyEncrypted1',
      mnemonicEncrypted: 'mnemonicEncrypted1',
      n: 1
    })
  };

  const walletClientMock = {
    id: 'id1',
    copayerId: 'copayerId1',
    n: 1,
    m: 1,
    credentials: {
      coin: 'btc',
      network: 'livenet',
      n: 1,
      m: 1,
      walletId: 'id1',
      keyId: 'keyId',
      rootPath: "m/44'/0'/0'",
      addressType: 'P2PKH',
      walletName: 'walletName'
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
    //    xPrivKey: 'xPrivKey',  // xxPrivKey is no longer available directly as for BWC 9.4
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
        NOT_AUTHORIZED: Error,
        ERROR: Error,
        COPAYER_REGISTERED: Error
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
      class Key2 {
        id: string;

        constructor() {
          this.id = 'keyId';
        }
        match(_key1, _key2) {
          return false;
        }
        encrypt() {
          return true;
        }
        createCredentials(_, _opts) {
          return true;
        }
        isPrivKeyEncrypted() {
          return false;
        }
        toObj() {
          return keysArrayFromStorage[0];
        }
      }
      return Key2;
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
        credentials: [
          {
            walletId: 'id1',
            keyId: 'keyId1',
            m: 1,
            n: 1
          }
        ],
        keys: [
          {
            mnemonic: 'mom mom mom mom mom mom mom mom mom mom mom mom',
            xPrivKey: 'xPrivKey1',
            isPrivKeyEncrypted: () => {
              return false;
            },
            toObj: () => {
              return false;
            }
          }
        ]
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

  beforeEach(async () => {
    testBed = TestUtils.configureProviderTestingModule([
      { provide: BwcProvider, useClass: BwcProviderMock }
    ]);
    profileProvider = testBed.get(ProfileProvider);
    actionSheetProvider = testBed.get(ActionSheetProvider);
    configProvider = testBed.get(ConfigProvider);
    keyProvider = testBed.get(KeyProvider);
    replaceParametersProvider = testBed.get(ReplaceParametersProvider);
    platformProvider = testBed.get(PlatformProvider);
    txFormatProvider = testBed.get(TxFormatProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    persistenceProvider.load();

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

  describe('setBackupGroupFlag', () => {
    let keyId: string;
    beforeEach(() => {
      keyId = 'id3';
      profileProvider.walletsGroups[keyId] = {};
    });
    it('should set needsBackup to false for a specified keyId if !migrating', () => {
      profileProvider.setBackupGroupFlag(keyId);
      expect(profileProvider.walletsGroups[keyId].needsBackup).toBeFalsy();
    });

    it('should not set needsBackup to false for a specified keyId if migrating', () => {
      const migrating = true;
      profileProvider.setBackupGroupFlag(keyId, null, migrating);
      expect(profileProvider.walletsGroups[keyId].needsBackup).toBeUndefined();
    });

    it('should return if !keyId', () => {
      keyId = undefined;
      const setBackupGroupFlagSpy = spyOn(
        persistenceProvider,
        'setBackupGroupFlag'
      );
      profileProvider.setBackupGroupFlag(keyId);
      expect(setBackupGroupFlagSpy).not.toHaveBeenCalled();
    });
  });

  describe('setWalletBackup', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const walletId: string = 'id3';
      profileProvider.setWalletBackup(walletId);
      expect(profileProvider.wallet[walletId].needsBackup).toBeFalsy();
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
    let storeProfileSpy;
    beforeEach(() => {
      storeProfileSpy = spyOn(persistenceProvider, 'storeProfile');
    });
    it('should store the profile if it is dirty', () => {
      profileProvider.profile.dirty = true;
      storeProfileSpy.and.returnValue(Promise.resolve());
      profileProvider
        .storeProfileIfDirty()
        .then(() => {
          expect(storeProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should not store the profile if it is not dirty', () => {
      profileProvider.profile.dirty = false;
      storeProfileSpy.and.returnValue(Promise.resolve());
      profileProvider
        .storeProfileIfDirty()
        .then(() => {
          expect(storeProfileSpy).not.toHaveBeenCalled();
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
      const storeNewProfileSpy = spyOn(persistenceProvider, 'storeNewProfile');

      profileProvider.createProfile();

      expect(storeNewProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
    });
  });

  describe('loadAndBindProfile', () => {
    let getProfileSpy, storeProfileSpy;
    beforeEach(() => {
      getProfileSpy = spyOn(persistenceProvider, 'getProfile');
      storeProfileSpy = spyOn(
        persistenceProvider,
        'storeProfile'
      ).and.returnValue(Promise.resolve());
      spyOn(keyProvider, 'addKeys').and.returnValue(Promise.resolve());

      profileProvider.profile.credentials = [
        profileProvider.wallet.id1.credentials,
        profileProvider.wallet.id2.credentials
      ];

      profileProvider.profile.dirty = true;
      const opts = {
        pushNotifications: { enabled: true },
        bwsFor: 'id1'
      };

      spyOn(configProvider, 'get').and.returnValue(opts);
      profileProvider.profile.disclaimerAccepted = true;
    });
    it('should get and bind profile with migrated credentials and keys', () => {
      getProfileSpy.and.returnValue(Promise.resolve(profileProvider.profile));

      profileProvider
        .loadAndBindProfile()
        .then(onbordingState => {
          expect(onbordingState).toBeUndefined();
          expect(storeProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should get and bind profile with migrated credentials', () => {
      BwcProviderMock.prototype.upgradeMultipleCredentialsV1 = (
        _oldCredentials: any
      ) => {
        const migrated = {
          credentials: [
            {
              walletId: 'id1',
              keyId: 'keyId1',
              m: 1,
              n: 1
            }
          ],
          keys: []
        };
        return migrated;
      };

      getProfileSpy.and.returnValue(Promise.resolve(profileProvider.profile));

      profileProvider
        .loadAndBindProfile()
        .then(onbordingState => {
          expect(onbordingState).toBeUndefined();
          expect(storeProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should get, bind and return profile without migrated credentials or keys', () => {
      BwcProviderMock.prototype.upgradeMultipleCredentialsV1 = (
        _oldCredentials: any
      ) => {
        const migrated = {
          credentials: [],
          keys: []
        };
        return migrated;
      };

      getProfileSpy.and.returnValue(Promise.resolve(profileProvider.profile));

      profileProvider
        .loadAndBindProfile()
        .then(onbordingState => {
          expect(onbordingState).toBeUndefined();
          expect(storeProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
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

    it('should set disclaimerAccepted with true if OLD flag is true', () => {
      profileProvider.profile.disclaimerAccepted = false;

      spyOn(persistenceProvider, 'getCopayDisclaimerFlag').and.returnValue(
        Promise.resolve(true)
      );

      profileProvider
        .isDisclaimerAccepted()
        .then(() => {
          expect(profileProvider.profile.disclaimerAccepted).toBeTruthy();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });

    it('should not set disclaimerAccepted if OLD flag is not present', () => {
      profileProvider.profile.disclaimerAccepted = false;

      spyOn(persistenceProvider, 'getCopayDisclaimerFlag').and.returnValue(
        Promise.resolve(null)
      );

      profileProvider.isDisclaimerAccepted().catch(() => {
        expect(profileProvider.profile.disclaimerAccepted).toBeFalsy();
      });
    });
  });

  describe('createWallet', () => {
    let handleEncryptedWalletSpy;
    beforeEach(() => {
      handleEncryptedWalletSpy = spyOn(keyProvider, 'handleEncryptedWallet');
      handleEncryptedWalletSpy.and.returnValue(Promise.resolve());
      spyOn(keyProvider, 'addKey').and.returnValue(Promise.resolve());
      configProvider.set({ bwsFor: 'id1' });
      spyOn(
        actionSheetProvider,
        'createEncryptPasswordComponent'
      ).and.returnValue({
        present: () => {},
        dismiss: () => {}
      });
    });
    it('should create wallet using seed from mnemonic', () => {
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

    it('should create wallet using seed from extendedPrivateKey', () => {
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

    it('should create wallet using seed from extendedPublicKey', () => {
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

    it('should create wallet using from random mnemonic', () => {
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
      spyOn<any>(profileProvider, 'askToEncryptKey').and.returnValue(
        Promise.resolve(true)
      );
      const opts = {
        pushNotifications: { enabled: true },
        bwsFor: 'id1'
      };

      spyOn(configProvider, 'get').and.returnValue(opts);
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);
    });

    it('should join wallet and publish "Local/WalletUpdate" event', async () => {
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
      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletUpdate', {
        walletId: 'id1'
      });
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
    beforeEach(() => {
      spyOn(persistenceProvider, 'getLastKnownBalance').and.callFake(
        (_id: string) => {
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
      );
    });
    it('should set the last known balance', () => {
      profileProvider.setLastKnownBalance();
      expect(profileProvider.wallet.id1.lastKnownBalance).toEqual('10.00 BTC');
      expect(profileProvider.wallet.id2.lastKnownBalance).toEqual('5.00 BCH');
    });
  });

  describe('getWallets', () => {
    beforeEach(() => {
      profileProvider.walletsGroups = {
        keyId1: {
          name: 'name1',
          needsBackup: true,
          order: 1
        },
        keyId2: {
          name: 'name2',
          needsBackup: true,
          order: 2
        }
      };
    });
    it('should get successfully all wallets when no opts', () => {
      const wallets = profileProvider.getWallets();
      expect(wallets).toEqual([
        profileProvider.wallet.id1,
        profileProvider.wallet.id3,
        profileProvider.wallet.id2
      ]);
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

    it('should get all the wallets that match the array of coins', () => {
      const opts = {
        coin: ['btc', 'bch'],
        network: 'livenet'
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([
        profileProvider.wallet.id1,
        profileProvider.wallet.id2
      ]);
    });

    it('should get all the backed up wallets', () => {
      walletMock['id3'].needsBackup = true;
      const opts = {
        backedUp: true
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([profileProvider.wallet.id1]);
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
      profileProvider.walletsGroups = {
        keyId1: {
          name: 'name1',
          needsBackup: true,
          order: 1
        },
        keyId2: {
          name: 'name2',
          needsBackup: true,
          order: 2
        }
      };

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

      spyOn(configProvider, 'get').and.returnValue({
        bwsFor: 'id1',
        desktopNotifications: { enabled: true },
        emailNotifications: { email: 'test@test.com' },
        pushNotifications: { enabled: false }
      });

      spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue({
        present: () => {
          return true;
        },
        dismiss: () => {
          return true;
        }
      });

      spyOn<any>(profileProvider, 'askToEncryptKey').and.returnValue(
        Promise.resolve(true)
      );

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

  describe('hasWalletWithFunds', () => {
    beforeAll(async () => {
      spyOn(RateProvider.prototype, 'getCoin').and.callFake(
        () => new Promise(resolve => resolve([{ code: 'BOB', rate: 123 }]))
      );
    });

    beforeEach(() => {
      profileProvider.wallet = _.clone(walletMock);
    });

    it('should return true with multiple wallets', () => {
      // The all wallets have more than 10 BOB worth of btc.
      const res = profileProvider.hasWalletWithFunds(10, 'BOB');
      expect(res).toEqual(true);
    });

    it('should return true just barely', () => {
      // The wallet w/ 10 btc should equate to 123 * 10 bob, which would result in this returning true
      const res = profileProvider.hasWalletWithFunds(1230, 'BOB');
      expect(res).toEqual(true);
    });

    it('should return false', () => {
      // The wallet w/ 10 btc is the biggest wallet. So no wallets are able to pay 1231 BOB.
      const res = profileProvider.hasWalletWithFunds(1231, 'BOB');
      expect(res).toEqual(false);
    });
  });
});
