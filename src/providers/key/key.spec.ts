import { TestUtils } from '../../test';

// Providers
import { KeyProvider, Logger, PersistenceProvider } from '..';

describe('KeyProvider', () => {
  let keyProvider: KeyProvider;
  let persistenceProvider: PersistenceProvider;
  let logger: Logger;
  let key;
  let keys: any[];
  let warnSpy;

  // Just for test
  function match(keya, keyb) {
    return keya.id == keyb.id;
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    keyProvider = testBed.get(KeyProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    persistenceProvider.load();
    logger = testBed.get(Logger);
    warnSpy = spyOn(logger, 'warn');
  });

  describe('addKey', () => {
    it('should add provided key to storage for the first time', async () => {
      key = {
        id: 'id1',
        xPrivKey: 'xPrivKey1',
        match
      };
      await keyProvider.load();
      keyProvider
        .addKey(key)
        .then(async () => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              }
            ]);
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("should add provided key to storage if doesn't already added", async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      await keyProvider.load();

      key = {
        id: 'id3',
        xPrivKey: 'xPrivKey3',
        match
      };

      keyProvider
        .addKey(key)
        .then(async () => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              },
              {
                id: 'id3',
                xPrivKey: 'xPrivKey3'
              }
            ]);
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should not add provided key to storage if it was already added', async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      await keyProvider.load();

      key = {
        id: 'id1',
        xPrivKey: 'xPrivKey1',
        match
      };

      keyProvider
        .addKey(key)
        .then(async () => {
          persistenceProvider.getKeys().then(() => {
            expect().nothing();
          });
        })
        .catch(err => {
          expect(err).toBeDefined();
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              }
            ]);
          });
        });
    });
  });

  describe('addKeys', () => {
    it('should add provided keys to storage for the first time', async () => {
      keys = [
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ];

      await keyProvider.load();
      keyProvider
        .addKeys(keys)
        .then(() => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              }
            ]);
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("should add provided keys to storage if doesn't already added", async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      keys = [
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match
        },
        {
          id: 'id4',
          xPrivKey: 'xPrivKey4',
          match
        }
      ];

      await keyProvider.load();
      keyProvider
        .addKeys(keys)
        .then(() => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              },
              {
                id: 'id3',
                xPrivKey: 'xPrivKey3'
              },
              {
                id: 'id4',
                xPrivKey: 'xPrivKey4'
              }
            ]);
          });
          expect(warnSpy).not.toHaveBeenCalled();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should add just unrepeated provided keys', async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      keys = [
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match
        },
        {
          id: 'id4',
          xPrivKey: 'xPrivKey4',
          match
        },
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match
        },
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id5',
          xPrivKey: 'xPrivKey5',
          match
        }
      ];

      await keyProvider.load();
      keyProvider
        .addKeys(keys)
        .then(() => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              },
              {
                id: 'id3',
                xPrivKey: 'xPrivKey3'
              },
              {
                id: 'id4',
                xPrivKey: 'xPrivKey4'
              },
              {
                id: 'id5',
                xPrivKey: 'xPrivKey5'
              }
            ]);
          });
          expect(warnSpy).toHaveBeenCalledTimes(2);
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('getKey', () => {
    it("should get null if provided keyId doesn't match", async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      await keyProvider.load();
      keyProvider
        .getKey('id3')
        .then(key => {
          expect(key).toBeNull();
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it('should get the correct key of a provided keyId', async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      await keyProvider.load();
      keyProvider
        .getKey('id2')
        .then(key => {
          expect(key).toEqual({
            id: 'id2',
            xPrivKey: 'xPrivKey2'
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });
  });

  describe('removeKey', () => {
    it('should return error if trying to remove a key from undefined', async () => {
      await keyProvider.load();
      keyProvider
        .removeKey('id1')
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it('should remove key of a provided id if it was already added', async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        },
        {
          id: 'id3',
          xPrivKey: 'xPrivKey3',
          match
        }
      ]);

      await keyProvider.load();
      keyProvider
        .removeKey('id2')
        .then(() => {
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id3',
                xPrivKey: 'xPrivKey3'
              }
            ]);
          });
        })
        .catch(err => {
          expect(err).toBeUndefined();
        });
    });

    it("should return error if trying to remove a key and it doesn't already added", async () => {
      await persistenceProvider.setKeys([
        {
          id: 'id1',
          xPrivKey: 'xPrivKey1',
          match
        },
        {
          id: 'id2',
          xPrivKey: 'xPrivKey2',
          match
        }
      ]);

      await keyProvider.load();
      keyProvider
        .removeKey('id3')
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).toBeDefined();
          persistenceProvider.getKeys().then((keys: any[]) => {
            expect(keys).toEqual([
              {
                id: 'id1',
                xPrivKey: 'xPrivKey1'
              },
              {
                id: 'id2',
                xPrivKey: 'xPrivKey2'
              }
            ]);
          });
        });
    });
  });
});
