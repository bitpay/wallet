'use strict';
//
// test/unit/filters/filtersSpec.js
//
describe('Angular Filters', function() {

  beforeEach(angular.mock.module('copayApp'));
  beforeEach(module('copayApp.filters'));
  beforeEach(inject(function($rootScope) {

    var w = {};
    w.isComplete = sinon.stub().returns(true);
    w.privateKey = {};
    w.settings = {
      unitToSatoshi: 100,
      unitDecimals: 2,
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    };
    w.addressBook = {
      'juan': '1',
    };
    w.balanceByAddr = [{
      'address1': 1
    }];

    w.totalCopayers = 2;
    w.getMyCopayerNickname = sinon.stub().returns('nickname');
    w.getMyCopayerId = sinon.stub().returns('id');
    w.privateKey.toObj = sinon.stub().returns({
      wallet: 'mock'
    });
    w.getSecret = sinon.stub().returns('secret');
    w.getName = sinon.stub().returns('fakeWallet');
    w.getId = sinon.stub().returns('id');
    w.exportEncrypted = sinon.stub().returns('1234567');
    w.getTransactionHistory = sinon.stub().yields({});
    w.getNetworkName = sinon.stub().returns('testnet');
    w.getAddressesInfo = sinon.stub().returns({});

    w.createTx = sinon.stub().yields(null);
    w.sendTx = sinon.stub().yields(null);
    w.requiresMultipleSignatures = sinon.stub().returns(true);
    w.getTxProposals = sinon.stub().returns([1, 2, 3]);
    $rootScope.wallet = w;
  }));






  var walletConfig = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    reconnectDelay: 100,
    networkName: 'testnet',
    alternativeName: 'lol currency',
    alternativeIsoCode: 'LOL'
  };



  describe('removeEmpty addresses', function() {
    it('should work with empty lists', inject(function($filter) {
      var removeEmpty = $filter('removeEmpty');
      expect(removeEmpty([]).length).to.equal(0);
    }));

    it('should work with undefined', inject(function($filter) {
      var removeEmpty = $filter('removeEmpty');
      expect(removeEmpty(undefined).length).to.equal(0);
    }));

    it('should filter empty change addresses from other copayers', inject(function($filter) {
      var removeEmpty = $filter('removeEmpty');
      var addresses = [{
        owned: true,
        isChange: false,
        balance: 0
      }, {
        owned: false,
        isChange: false,
        balance: 0
      }, {
        owned: true,
        isChange: true,
        balance: 0
      }, {
        owned: false,
        isChange: true,
        balance: 0
      }];
      expect(removeEmpty(addresses).length).to.equal(2);
    }));
  });

  describe('noFractionNumber', function() {
    describe('noFractionNumber bits', function() {
      beforeEach(inject(function($rootScope) {
        var w = $rootScope.wallet;
        w.settings.unitToSatoshi = 100;
        w.settings.unitName = 'bits';
      }));
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
      beforeEach(inject(function($rootScope) {
        var w = $rootScope.wallet;
        w.settings.unitToSatoshi = 100000000;
        w.settings.unitName = 'BTC';
      }));
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
      beforeEach(inject(function($rootScope) {
        var w = $rootScope.wallet;
        w.settings.unitToSatoshi = 100000;
        w.settings.unitName = 'mBTC';
      }));
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
});
