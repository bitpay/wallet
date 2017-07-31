import { StorageProvider } from './storage-provider';
 
describe('Storage Service', () => {
    it('should do nothing', () => {
      expect(true).toBeTruthy();
    });
    it('should get', () => {
      var storage = new StorageProvider();
      expect(storage.get('myKey')).toEqual('myKey');
    });
});