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
      var addresses = [{
        isChange: true,
        balance: 0
      }, {
        isChange: false,
        balance: 0
      }, {
        isChange: true,
        balance: 0
      }, {
        isChange: false,
        balance: 0
      }, {
        isChange: true,
        balance: 0
      }, {
        isChange: false,
        balance: 0
      }, {
        isChange: true,
        balance: 0
      }, {
        isChange: false,
        balance: 0
      }];
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

  describe('noFractionNumber bits', function() {
    beforeEach(function() {
      config.unitToSatoshi = 100;
      config.unitName = 'bits';
    });
    it('should format number to display correctly', inject(function($filter) {
      var noFraction = $filter('noFractionNumber');
      expect(noFraction(3100)).to.equal('3,100');
      expect(noFraction(3100200)).to.equal('3,100,200');
      expect(noFraction(3)).to.equal('3');
      expect(noFraction(0.3)).to.equal(0.3);
      expect(noFraction(0.30000000)).to.equal(0.3);
      expect(noFraction(3200.01)).to.equal('3,200.01');
      expect(noFraction(3200890.010000)).to.equal('3,200,890.01');
    }));
  });

  describe('noFractionNumber BTC', function() {
    beforeEach(function() {
      config.unitToSatoshi = 100000000;
      config.unitName = 'BTC';
    });
    it('should format number to display correctly', inject(function($filter) {
      var noFraction = $filter('noFractionNumber');
      expect(noFraction(0.30000000)).to.equal(0.3);
      expect(noFraction(0.00302000)).to.equal(0.00302);
      expect(noFraction(1.00000001)).to.equal(1.00000001);
      expect(noFraction(3.10000012)).to.equal(3.10000012);
      expect(noFraction(0.00100000)).to.equal(0.001);
      expect(noFraction(0.00100009)).to.equal(0.00100009);
      expect(noFraction(2000.00312011)).to.equal('2,000.00312011');
      expect(noFraction(2000998.00312011)).to.equal('2,000,998.00312011');
    }));
  });

  describe('noFractionNumber mBTC', function() {
    beforeEach(function() {
      config.unitToSatoshi = 100000;
      config.unitName = 'mBTC';
    });
    it('should format number to display correctly', inject(function($filter) {
      var noFraction = $filter('noFractionNumber');
      expect(noFraction(0.30000)).to.equal(0.3);
      expect(noFraction(0.00302)).to.equal(0.00302);
      expect(noFraction(1.00001)).to.equal(1.00001);
      expect(noFraction(3.10002)).to.equal(3.10002);
      expect(noFraction(0.00100000)).to.equal(0.001);
      expect(noFraction(0.00100009)).to.equal(0.001);
      expect(noFraction(2000.00312)).to.equal('2,000.00312');
      expect(noFraction(2000998.00312)).to.equal('2,000,998.00312');
    }));
  });

  describe('noFractionNumber:custom fractionSize', function() {
    it('should format number to display correctly', inject(function($filter) {
      var noFraction = $filter('noFractionNumber');
      expect(noFraction(0.30000, 0)).to.equal('0');
      expect(noFraction(1.00001, 0)).to.equal('1');
      expect(noFraction(3.10002, 0)).to.equal('3');
      expect(noFraction(2000.00312, 0)).to.equal('2,000');
      expect(noFraction(2000998.00312, 0)).to.equal('2,000,998');
    }));
  });

});
