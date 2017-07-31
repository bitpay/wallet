import { StorageService } from './storage-service';
 
describe('Storage Service', () => {
    it('should do nothing', () => {
      expect(true).toBeTruthy();
    });
    it('should get', () => {
      var storage = new StorageService();
      expect(storage.get('myKey')).toEqual('myKey');
    });
});