// ADD SETTER AND GETTER TO key-encrypt.ts TO RUN THIS TESTS
// Necessary to run unit tests
// get STORAGE_ENCRYPTING_KEYS() {
//   return privateProps.get(this).STORAGE_ENCRYPTING_KEYS;
// }
// set STORAGE_ENCRYPTING_KEYS(STORAGE_ENCRYPTING_KEYS) {
//   privateProps.set(this, { STORAGE_ENCRYPTING_KEYS });
// }
// import BWC from 'bitcore-wallet-client';
// import { TestUtils } from '../../test';
// import { Logger } from '../logger/logger';
// import { LocalStorage } from '../persistence/storage/local-storage';
// import { KeyEncryptProvider } from './key-encrypt';

// describe('KeyEncryptProvider', () => {
//   let keyEncryptProvider: KeyEncryptProvider;
//   let localStorage: LocalStorage;
//   let logger: Logger;
//   let loggerSpy;
//   let loggerErrSpy;

//   beforeEach(async () => {
//     const testBed = TestUtils.configureProviderTestingModule();
//     keyEncryptProvider = testBed.get(KeyEncryptProvider);
//     localStorage = testBed.get(LocalStorage);
//     logger = testBed.get(Logger);
//     loggerSpy = spyOn(logger, 'debug');
//     loggerErrSpy = spyOn(logger, 'error');
//   });

//   describe('Init function', () => {
//     it('should run init without errors if no keys to decrypt', async () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'asdfghjklpoiuytrewqazxcvbnjskawq'
//       ];
//       await keyEncryptProvider.init();
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Running key encrypt provider init function'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith('KeyEncryptProvider - no keys');
//       expect(loggerSpy).toHaveBeenCalledTimes(2);
//     });

//     it('should run init without errors if no encrypting keys found and not modified any key', async () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [];
//       await localStorage.set('keys', [{ key: 'key1' }]);
//       await keyEncryptProvider.init();
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Running key encrypt provider init function'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'KeyEncryptProvider - no encrypting keys'
//       );
//       let keys = await localStorage.get('keys');
//       expect(keys).toEqual([{ key: 'key1' }]);
//     });

//     it('should show an error if could not decrypt', async () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'poiqwerlkhjkasdfgiuwerhjabsdfgks',
//         'asdfghjklpoiuytrewqazxcvbnjskawq'
//       ];
//       const encryptedKeys = BWC.sjcl.encrypt(
//         'agksdfkjg234587asdjkhfdsakhjg283',
//         JSON.stringify([{ key: 'key1' }])
//       );
//       spyOn(localStorage, 'get').and.returnValue(
//         Promise.resolve(JSON.parse(encryptedKeys))
//       );
//       await keyEncryptProvider.init();
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Running key encrypt provider init function'
//       );
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS.forEach(value => {
//         const storageEncryptingKeyHash = BWC.Bitcore.crypto.Hash.sha256(
//           Buffer.from(value)
//         ).toString('hex');
//         expect(loggerSpy).toHaveBeenCalledWith(
//           `Trying to decrypt with: ${storageEncryptingKeyHash}`
//         );
//       });
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Could not decrypt storage. Tested 2 keys without success'
//       );
//       expect(loggerErrSpy).toHaveBeenCalledWith("ccm: tag doesn't match");
//       expect(keyEncryptProvider.keyEncryptionErr.message).toEqual(
//         'This version is not compatible with your storage, please update to the most recent version or contact support and share the logs provided.'
//       );
//     });

//     it('should encrypt keys that are not yet encrypted', async () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'asdfghjklpoiuytrewqazxcvbnjskawq'
//       ];
//       const spy = spyOn(localStorage, 'get').and.returnValue(
//         Promise.resolve([{ key: 'key1' }])
//       );
//       await keyEncryptProvider.init();
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Running key encrypt provider init function'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Could not decrypt storage. Tested 1 keys without success'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith('Not yet encrypted?');
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Storage encrypted with key number: 1'
//       );
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS.forEach(value => {
//         const storageEncryptingKeyHash = BWC.Bitcore.crypto.Hash.sha256(
//           Buffer.from(value)
//         ).toString('hex');
//         expect(loggerSpy).toHaveBeenCalledWith(
//           `Trying to decrypt with: ${storageEncryptingKeyHash}`
//         );
//       });
//       spy.and.callThrough();
//       const keys = await localStorage.get('keys');
//       const decryptedKeys = BWC.sjcl.decrypt(
//         'asdfghjklpoiuytrewqazxcvbnjskawq',
//         JSON.stringify(keys)
//       );
//       expect(JSON.parse(decryptedKeys)).toEqual([{ key: 'key1' }]);
//     });

//     it('should try to decrypt keys with all encrypting keys till find the correct one and encrypt with the last one', async () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'agksdfkjg234587asdjkhfdsakhjg283',
//         'poiqwerlkhjkasdfgiuwerhjabsdfgks',
//         'asdfghjklpoiuytrewqazxcvbnjskawq'
//       ];
//       const encryptedKeys = BWC.sjcl.encrypt(
//         'poiqwerlkhjkasdfgiuwerhjabsdfgks',
//         JSON.stringify([{ key: 'key1' }])
//       );
//       let spy = spyOn(localStorage, 'get').and.returnValue(
//         Promise.resolve(JSON.parse(encryptedKeys))
//       );
//       await keyEncryptProvider.init();
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Running key encrypt provider init function'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Storage decrypted with key number: 2'
//       );
//       expect(loggerSpy).toHaveBeenCalledWith(
//         `Storage encrypted with key number: ${keyEncryptProvider.STORAGE_ENCRYPTING_KEYS.length}`
//       );
//       const storageEncryptingKeyHash1 = BWC.Bitcore.crypto.Hash.sha256(
//         Buffer.from(keyEncryptProvider.STORAGE_ENCRYPTING_KEYS[0])
//       ).toString('hex');
//       expect(loggerSpy).toHaveBeenCalledWith(
//         `Trying to decrypt with: ${storageEncryptingKeyHash1}`
//       );

//       const storageEncryptingKeyHash2 = BWC.Bitcore.crypto.Hash.sha256(
//         Buffer.from(keyEncryptProvider.STORAGE_ENCRYPTING_KEYS[0])
//       ).toString('hex');
//       expect(loggerSpy).toHaveBeenCalledWith(
//         `Trying to decrypt with: ${storageEncryptingKeyHash2}`
//       );
//       spy.and.callThrough();
//       const keys = await localStorage.get('keys');
//       const decryptedKeys = BWC.sjcl.decrypt(
//         'asdfghjklpoiuytrewqazxcvbnjskawq',
//         JSON.stringify(keys)
//       );
//       expect(JSON.parse(decryptedKeys)).toEqual([{ key: 'key1' }]);
//     });
//   });

//   describe('Decrypt and Encrypt function', () => {
//     it('should decrypt correctly', () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'agksdfkjg234587asdjkhfdsakhjg283'
//       ];
//       const encryptedKeys = BWC.sjcl.encrypt(
//         'agksdfkjg234587asdjkhfdsakhjg283',
//         JSON.stringify([{ key: 'key1' }])
//       );
//       const decryptedKeys = keyEncryptProvider.decryptKeys(
//         JSON.parse(encryptedKeys)
//       );
//       expect(JSON.parse(decryptedKeys)).toEqual([{ key: 'key1' }]);
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Storage decrypted successfully with key number: 1'
//       );
//     });

//     it('should encrypt correctly', () => {
//       keyEncryptProvider.STORAGE_ENCRYPTING_KEYS = [
//         'agksdfkjg234587asdjkhfdsakhjg283'
//       ];
//       const encryptedKeys = keyEncryptProvider.encryptKeys([{ key: 'key1' }]);
//       const decryptedKeys = BWC.sjcl.decrypt(
//         'agksdfkjg234587asdjkhfdsakhjg283',
//         encryptedKeys
//       );
//       expect(JSON.parse(decryptedKeys)).toEqual([{ key: 'key1' }]);
//       expect(loggerSpy).toHaveBeenCalledWith(
//         'Storage encrypted successfully with key number: 1'
//       );
//     });
//   });
// });
