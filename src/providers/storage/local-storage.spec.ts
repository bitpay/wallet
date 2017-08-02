import { LocalStorage } from './local-storage';
 
describe('Local Storage', () => {
    it('should do nothing', () => {
      expect(true).toBeTruthy();
    });
    it('should get', () => {
      var storage = new LocalStorage();
      expect(storage.get('myKey')).toEqual('myKey');
    });
});