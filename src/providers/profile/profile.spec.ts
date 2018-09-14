import * as _ from 'lodash';
import { BwcProvider, PersistenceProvider } from '..';
import { TestUtils } from '../../test';
import { ProfileProvider } from './profile';

describe('Profile Provider', () => {
  let profileProvider: ProfileProvider;
  const walletFixture = {
    api1: {
      id: 'eabee25b-d6ab-4b11-8b76-88570d826914',
      cachedBalance: '10.00 BTC',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'livenet',
        n: 1,
        m: 1
      },
      status: {
        availableBalanceSat: 1000000000 // 10 BTC
      },
      isComplete: () => {
        return true;
      },
      order: ''
    },
    api2: {
      id: 'zxccv25b-d6ab-4b11-8b76-88570d822222',
      cachedBalance: '5.00 BCH',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'bch',
        network: 'livenet',
        n: 1,
        m: 1
      },
      status: {
        availableBalanceSat: 500000000 // 5 BCH
      },
      isComplete: () => {
        return true;
      },
      order: 2
    },
    api3: {
      id: 'qwert25b-d6ab-4b11-8b76-88570d833333',
      cachedBalance: '1.50 BTC',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2
      },
      status: {
        availableBalanceSat: 150000000 // 1.50 BTC
      },
      isComplete: () => {
        return true;
      },
      order: 3
    }
  };

  class BwcProviderMock {
    constructor() {}
    getErrors() {
      return 'error';
    }
    getBitcoreCash() {
      return true;
    }
  }

  class PersistenceProviderMock {
    constructor() {}
    getBalanceCache() {
      return Promise.resolve('0.00 BTC');
    }
    setWalletOrder() {
      return Promise.resolve();
    }
    getWalletOrder() {
      return Promise.resolve('');
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: BwcProvider, useClass: BwcProviderMock },
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    profileProvider = testBed.get(ProfileProvider);
    profileProvider.wallet = walletFixture;
  });

  describe('getWallets()', () => {
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
      expect(wallets).toEqual([profileProvider.wallet.api3]);
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

  describe('wallet order', () => {
    it('should get null order', () => {
      const walletId: string = 'eabee25b-d6ab-4b11-8b76-88570d826914';
      profileProvider.getWalletOrder(walletId).then(order => {
        expect(order).toBe('');
      });
    });
    it('should set the order', () => {
      const walletId: string = 'eabee25b-d6ab-4b11-8b76-88570d826914';
      const order: number = 2;
      profileProvider.setWalletOrder(walletId, order);
      expect(profileProvider.wallet.api1.order).toBeDefined();
      profileProvider.wallet.api1.order = order;
      expect(profileProvider.wallet.api1.order).toBe(2);
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
});
