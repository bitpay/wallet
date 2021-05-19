import { TestUtils } from '../../test';
import { PersistenceProvider } from '../persistence/persistence';
import { AddressBookProvider, Contact } from './address-book';

describe('AddressBookProvider', () => {
  let addressBookProvider: AddressBookProvider;
  let persistenceProvider: PersistenceProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressBookProvider = testBed.get(AddressBookProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    persistenceProvider.load();
  });

  describe('get function', () => {
    it('If an address is tesnet and the address exist, get function will return the address book', () => {
      const addr = 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm'; // btc testnet
      const response: string =
        '{"mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm":{"address":"mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm","email": "test@test.com","name": "test"}}';
      const promise = Promise.resolve(response);
      const getAddressBookSpy = spyOn(
        persistenceProvider,
        'getAddressBook'
      ).and.returnValue(promise);

      addressBookProvider
        .get(addr, 'testnet')
        .then(result => {
          const expectedResult: Contact = {
            address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
            email: 'test@test.com',
            name: 'test',
            coin: 'btc',
            network: 'testnet',
            tag: undefined
          };

          expect(getAddressBookSpy).toHaveBeenCalledWith('testnet', true);
          expect(result).toEqual(expectedResult);
        })
        .catch(err => expect(err).toBeNull);
    });
    it('If an address does not exist on Address Book, getAddressBook function will try again with livenet', () => {
      const addr = '12o6WhDjZhxt2Nwvm98J6ojXxY1LmEqGbK'; // btc livenet

      addressBookProvider
        .get(addr, 'livenet')
        .then(() => {
          expect(persistenceProvider.getAddressBook).toHaveBeenCalledWith(
            'livenet'
          );
        })
        .catch(err => expect(err).toBeNull);
    });
    it('If the getAddressBook function fails, get function will be rejected', () => {
      const addr = '12o6WhDjZhxt2Nwvm98J6ojXxY1LmEqGbK'; // btc livenet
      const promise = Promise.reject('Error');

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider
        .get(addr, 'livenet')
        .then(result => {
          expect(result).toBeUndefined();
        })
        .catch(err => expect(err).toBeNull);
    });
  });

  describe('list function', () => {
    it('list function will return all the address book', () => {
      const response = {
        '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU': {
          address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
          email: 'a@a.com',
          name: 'a'
        },
        mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm: {
          address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
          email: 'asd@sad.com',
          name: 'jp'
        }
      };
      const promise = Promise.resolve(response);
      const getAddressBookSpy = spyOn(
        persistenceProvider,
        'getAddressBook'
      ).and.returnValue(promise);

      addressBookProvider.list('testnet').then(() => {
        expect(getAddressBookSpy).toHaveBeenCalledWith('testnet', true);
      });
      addressBookProvider.list('livenet').then(() => {
        expect(getAddressBookSpy).toHaveBeenCalledWith('livenet', true);
      });
    });
    it('list function will reject if an error occurred', () => {
      const errorMsg = 'Could not get the Addressbook';
      const promise = Promise.reject(errorMsg);

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.list('livenet').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
  });

  describe('add function', () => {
    it('If network is empty add function will reject', () => {
      const errorMsg = 'Not valid bitcoin address';
      const entry: Contact = {
        address: 'invalidAddress',
        email: 'a@a.com',
        name: 'a',
        coin: 'btc',
        network: 'livenet'
      };

      addressBookProvider.add(entry).catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If entry already exist add function will reject', () => {
      const errorMsg = 'Entry already exist';
      const response = {
        '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU': {
          address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
          email: 'test@test.com',
          name: 'test'
        },
        mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm: {
          address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
          email: 'asd@sad.com',
          name: 'jp'
        }
      };
      const promise = Promise.resolve(response);
      const entry: Contact = {
        address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
        email: 'test2@test2.com',
        name: 'test2',
        coin: 'btc'
      };

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.add(entry).catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If getAddressBook fails, add function will reject', () => {
      const errorMsg = 'Error adding new entry';
      const promise = Promise.reject(errorMsg);
      const entry: Contact = {
        address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
        email: 'test2@test2.com',
        name: 'test2',
        coin: 'btc'
      };

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.add(entry).catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If setAddressBook fails, add function will reject (add)', () => {
      const errorMsg = 'Entry already exist';
      const promise = Promise.reject(errorMsg);
      const entry: Contact = {
        address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
        email: 'test2@test2.com',
        name: 'test2',
        coin: 'btc'
      };

      spyOn(persistenceProvider, 'setAddressBook').and.returnValue(promise);
      addressBookProvider.add(entry).catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('Add an entry to addressbook if everything is ok', () => {
      const entry: Contact = {
        address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
        email: 'asd@sad.com',
        name: 'jp',
        coin: 'btc',
        network: 'testnet'
      };

      addressBookProvider
        .add(entry)
        .then(() => {
          expect(persistenceProvider.getAddressBook).toHaveBeenCalledWith(
            'testnet'
          );
        })
        .catch(err => expect(err).toBeNull);
    });
  });

  describe('remove function', () => {
    it('If network is empty remove function will reject', () => {
      const errorMsg = 'Not valid bitcoin address';
      const address = 'invalidAddress';

      addressBookProvider.remove(address, '', '').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('Remove an address book that exist', () => {
      const response: Contact[] = [
        {
          address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
          email: 'test@test.com',
          name: 'test',
          network: 'testnet',
          coin: 'btc'
        },
        {
          address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
          email: 'asd@sad.com',
          name: 'jp',
          network: 'testnet',
          coin: 'btc'
        }
      ];
      const promise = Promise.resolve(response);
      const address = 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm';

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider
        .remove(address, 'testnet', 'btc')
        .then(result => {
          const expectedResult = {
            address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
            email: 'test@test.com',
            name: 'test',
            network: 'testnet',
            coin: 'btc'
          };

          expect(persistenceProvider.getAddressBook).toHaveBeenCalledWith(
            'testnet'
          );
          console.log(typeof result);
          expect(result).toEqual(expectedResult);
        })
        .catch(err => expect(err).toBeNull);
    });
    it('If an address book does not exist, the remove function will reject', () => {
      const errorMsg = 'Entry does not exist';
      const response = {
        '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU': {
          address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
          email: 'test@test.com',
          name: 'test'
        },
        mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm: {
          address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
          email: 'asd@sad.com',
          name: 'jp'
        }
      };
      const promise = Promise.resolve(response);
      const address = 'mwsHDe7SBo2p9iWyiLMSuDvqa6W1w5qgPj';

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.remove(address, 'livenet', 'btc').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If the address book is empty, the remove function will reject', () => {
      const errorMsg = 'Addressbook is empty';
      const response = {};
      const promise = Promise.resolve(response);
      const address = 'mwsHDe7SBo2p9iWyiLMSuDvqa6W1w5qgPj';

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.remove(address, 'livenet', 'btc').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If getAddressBook fails, the remove function will reject', () => {
      const errorMsg = 'Error';
      const promise = Promise.reject(errorMsg);
      const address = 'mwsHDe7SBo2p9iWyiLMSuDvqa6W1w5qgPj';

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(promise);
      addressBookProvider.remove(address, 'livenet', 'btc').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
    it('If setAddressBook fails, remove function will reject', () => {
      const response = {
        '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU (btc)': {
          address: '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU',
          email: 'test@test.com',
          name: 'test',
          coin: 'btc',
          network: 'livenet'
        },
        'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm (btc)': {
          address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
          email: 'asd@sad.com',
          name: 'jp',
          coin: 'btc',
          network: 'livenet'
        }
      };
      const getAddressBookPromise = Promise.resolve(response);
      const errorMsg = 'Error deleting entry';
      const setAddressBookPromise = Promise.reject(errorMsg);
      const address = '1Q2aGBWZHNuZ7WjB9komwj9fF9GmnK5AzU';

      spyOn(persistenceProvider, 'getAddressBook').and.returnValue(
        getAddressBookPromise
      );
      spyOn(persistenceProvider, 'setAddressBook').and.returnValue(
        setAddressBookPromise
      );
      addressBookProvider.remove(address, 'livenet', 'btc').catch(err => {
        expect(err).toEqual(errorMsg);
      });
    });
  });
});
