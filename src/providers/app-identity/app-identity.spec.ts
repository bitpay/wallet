import * as bitauthService from 'bitauth';
import { TestUtils } from '../../test';

// Providers
import { AppIdentityProvider, PersistenceProvider } from '..';

describe('AppIdentityProvider', () => {
  let appIdentityProvider: AppIdentityProvider;
  let identityFromPersitence: Promise<any>;

  class PersistenceProviderMock {
    constructor() {}
    getAppIdentity(_network) {
      return identityFromPersitence;
    }
    setAppIdentity(_network, _appIdentity) {
      return identityFromPersitence;
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    appIdentityProvider = testBed.get(AppIdentityProvider);
  });

  describe('getIdentity', () => {
    it('should get the app identity if persistence returns undefined', () => {
      const network: string = 'livenet';
      identityFromPersitence = Promise.resolve(undefined);

      const cb = (_err, _appIdentity) => {
        expect(_err).toBeNull();
        expect(_appIdentity.created).toBeDefined();
        expect(_appIdentity.priv).toBeDefined();
        expect(_appIdentity.pub).toBeDefined();
        expect(_appIdentity.sin).toBeDefined();
      };

      appIdentityProvider.getIdentity(network, cb);
    });

    it('should get the app identity if persistence returns valid data', () => {
      const network: string = 'livenet';
      const identityMock = {
        created: 1558467624966,
        priv: 'priv1',
        pub: 'pub1',
        sin: 'sin1'
      };
      identityFromPersitence = Promise.resolve(identityMock);

      const cb = (_err, _appIdentity) => {
        expect(_err).toBeNull();
        expect(_appIdentity).toEqual(identityMock);
      };

      appIdentityProvider.getIdentity(network, cb);
    });

    it('should get error if bitauthService fails', () => {
      const network: string = 'livenet';
      const identityMock = {
        created: 1558467624966,
        priv: 'priv1',
        pub: 'pub1',
        sin: 'sin1'
      };
      identityFromPersitence = Promise.resolve(identityMock);

      spyOn(bitauthService, 'getPublicKeyFromPrivateKey').and.throwError(
        'Error'
      );

      const cb = (_err, _appIdentity) => {
        expect(_err).toBeDefined();
        expect(_appIdentity).toBeUndefined();
      };

      appIdentityProvider.getIdentity(network, cb);
    });
  });
});
