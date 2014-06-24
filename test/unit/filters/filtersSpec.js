'use strict';
//
// test/unit/filters/filtersSpec.js
//
describe('Unit: Testing Filters', function() {

  beforeEach(module('copayApp.filters'));

  describe('limitAddress', function() {

    it('should handle emtpy list', inject(function($filter) {
      var limitAddress = $filter('limitAddress');
      expect(limitAddress([], false)).to.be.empty;
    }));

    it('should honor show all', inject(function($filter) {
      var limitAddress = $filter('limitAddress');
      var addresses = [{}, {}, {}, {}, {}];
      expect(limitAddress(addresses, true).length).to.equal(5);
      expect(limitAddress([{}], false).length).to.equal(1);
    }));

    it('should filter correctly', inject(function($filter) {
      var limitAddress = $filter('limitAddress');
      var addresses = [
        {isChange: true, balance: 0},
        {isChange: false, balance: 0},
        {isChange: true, balance: 0},
        {isChange: false, balance: 0},
        {isChange: true, balance: 0},
        {isChange: false, balance: 0},
        {isChange: true, balance: 0},
        {isChange: false, balance: 0}
      ];
      expect(limitAddress(addresses, false).length).to.equal(1);

      addresses[0].isChange = false;
      expect(limitAddress(addresses, false).length).to.equal(2);

      addresses[2].isChange = false;
      expect(limitAddress(addresses, false).length).to.equal(3);

      addresses[3].isChange = false;
      expect(limitAddress(addresses, false).length).to.equal(3);

      addresses[0].balance = 20;
      expect(limitAddress(addresses, false).length).to.equal(3);

      addresses[0].balance = 20;
      expect(limitAddress(addresses, false).length).to.equal(3);

      addresses[7].balance = 20;
      expect(limitAddress(addresses, false).length).to.equal(4);
    }));
  });
});
