'use strict';

var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();

var csv = require('../js/util/csv')
var moment = moment || require('moment');

describe('csv utils', function() {
  it('should convert simple json', function(done) {
    var data = [
      { name: 'Lennon John', age: 40 },
      { name: 'Cobain, Kurt', age: 27 },
    ];

    var descriptor = {
      columns: [
        { label: 'Name', property: 'name', type: 'string' },
        { label: 'Age', property: 'age', type: 'number' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('Name,Age\r\nLennon John,40\r\n"Cobain, Kurt",27\r\n');
      done();
    });
  });
  it('should handle empty data', function(done) {
    var data = [];

    var descriptor = {
      columns: [
        { label: 'Name', property: 'name', type: 'string' },
        { label: 'Age', property: 'age', type: 'number' },
        { property: 'lastLogin', type: 'date' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('Name,Age,lastLogin\r\n');
      done();
    });
  });
  it('should handle null row in data', function(done) {
    var data = [
      { name: 'John', age: 40 },
      null,
      { name: 'Kurt', age: 27 },
    ];

    var descriptor = {
      columns: [
        { label: 'Name', property: 'name', type: 'string' },
        { label: 'Age', property: 'age', type: 'number' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('Name,Age\r\nJohn,40\r\n,\r\nKurt,27\r\n');
      done();
    });
  });
  it('should format dates', function(done) {
    var data = [
      { name: 'John', age: 40, lastLogin: moment(1417608870000), },
      { name: 'Kurt', age: 27, lastLogin: moment('2014-11-01'), },
    ];

    var descriptor = {
      columns: [
        { property: 'name', type: 'string' },
        { property: 'age', type: 'number' },
        { property: 'lastLogin', type: 'date', format: 'YYYY MM DD' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('name,age,lastLogin\r\nJohn,40,2014 12 03\r\nKurt,27,2014 11 01\r\n');
      done();
    });
  });
  it('should compute values from function properties', function(done) {
    var data = [
      { name: 'John', payments: 400, withdrawals: 300, },
      { name: 'Kurt', payments: 270.5, withdrawals: 200, },
    ];

    var descriptor = {
      columns: [
        { property: 'name', type: 'string' },
        { label: 'Balance', property: function (obj) { return obj.payments - obj.withdrawals; }, type: 'number' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('name,Balance\r\nJohn,100\r\nKurt,70.5\r\n');
      done();
    });
  });  
  it('should not fail on error from calculated values', function(done) {
    var data = [
      { name: 'John', error: 0 },
      { name: 'Kurt', error: 1 },
    ];

    var descriptor = {
      columns: [{
        property: 'name',
        type: 'string'
      }, {
        label: 'Error',
        property: function(obj) {
          if (obj.error) {
            throw 'dummy error';
          } else {
            return 'ok';
          }
        }
      }, ],
    };
    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('name,Error\r\nJohn,ok\r\nKurt,dummy error\r\n');
      done();
    });
  });  
  it('should use blank label if label not specified for computed property', function(done) {
    var data = [
      { name: 'John', payments: 400, withdrawals: 300, },
      { name: 'Kurt', payments: 270.5, withdrawals: 200, },
    ];

    var descriptor = {
      columns: [
        { property: 'name', type: 'string' },
        { property: function (obj) { return obj.payments - obj.withdrawals; }, type: 'number' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('name,\r\nJohn,100\r\nKurt,70.5\r\n');
      done();
    });
  });  
  it('should handle non existent properties', function(done) {
    var data = [
      { name: 'John', age: 40 },
      { name: 'Kurt', age: 27 },
    ];

    var descriptor = {
      columns: [
        { property: 'name', type: 'string' },
        { property: 'age', type: 'number' },
        { property: 'lastLogin', type: 'date', format: 'YYYY MM DD' },
      ],
    };

    csv.toCsv(data, descriptor, function (err, res) {
      res.should.equal('name,age,lastLogin\r\nJohn,40,\r\nKurt,27,\r\n');
      done();
    });
  });  
});
