import { TestUtils } from '../../test';

// Providers
import { KeyProvider, Logger, PersistenceProvider } from '..';

describe('KeyProvider', () => {
  let keyProvider: KeyProvider;
  let logger: Logger;
  let getKeysFromPersitence: any[];
  let key;
  let keys: any[];
  let warnSpy;

  class PersistenceProviderMock {
    constructor() {}
    getKeys() {
      return Promise.resolve(getKeysFromPersitence);
    }
    setKeys(_keys: any[]) {
      return Promise.resolve();
    }
  }

  // Just for test
  function match(keya, keyb) {
    return keya.id == keyb.id;
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    keyProvider = testBed.get(KeyProvider);
    logger = testBed.get(Logger);
    warnSpy = spyOn(logger, 'warn');
  });

  describe('addKey', () => {
    it('should add provided key to storage for the first time', async () => {
      key = {
        id: 'id1',
        xPrivKey: 'xPrivKey1',
        match: match
      };
      getKeysFromPersitence = undefined;
      await keyProvider.load();
      await keyProvider
        .addKey(key)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("should add provided key to storage if doesn't already added", async () => {
      key = {
        id: 'id3',
        xPrivKey: 'xPrivKey3',
        match: match
      };
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .addKey(key)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should not add provided key to storage if it was already added', async () => {
      key = {
        id: 'id1',
        xPrivKey: 'xPrivKey1',
        match: match
      };
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider.addKey(key).catch(err => {
        expect(err).toBeDefined();
      });
    });
  });

  describe('addKeys', () => {
    it('should add provided key to storage for the first time', async () => {
      keys = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        }
      ];
      getKeysFromPersitence = undefined;

      await keyProvider.load();
      await keyProvider
        .addKeys(keys)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("should add provided key to storage if doesn't already added", async () => {
      keys = [
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match: match
        },
        {
          id: 'id4',
          xPrivKey: 'xPrivKey4',
          match: match
        }
      ];
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .addKeys(keys)
        .then(() => {
          expect(warnSpy).not.toHaveBeenCalled();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should not add provided key to storage if it was already added', async () => {
      keys = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match: match
        }
      ];
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .addKeys(keys)
        .then(() => {
          expect(warnSpy).toHaveBeenCalledTimes(1);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('getKey', () => {
    it("should get null if provided keyId doesn't match", async () => {
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .getKey('id3')
        .then(key => {
          expect(key).toBeNull();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should get the correct key of a provided keyId', async () => {
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .getKey('id2')
        .then(key => {
          expect(key).toEqual({
            id: 'id2',
            xPrivKey: 'xPrivKey2',
            match: match
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('removeKey', () => {
    it('should return error if trying to remove a key from undefined', async () => {
      getKeysFromPersitence = undefined;
      await keyProvider.load();
      await keyProvider
        .removeKey('id1')
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it("should return error if trying to remove a key and it doesn't already added", async () => {
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider
        .removeKey('id3')
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it('should remove key of a provided id if it was already added', async () => {
      getKeysFromPersitence = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match: match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match: match
        }
      ];

      await keyProvider.load();
      await keyProvider.removeKey('id1').catch(err => {
        expect(err).toBeUndefined();
      });
    });
  });
});
