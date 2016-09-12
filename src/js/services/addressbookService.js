'use strict';

angular.module('copayApp.services').factory('addressbookService', function(bitcore, storageService, lodash) {
  var root = {};

  root.get = function(addr, cb) {
    storageService.getAddressbook('testnet', function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      if (ab && ab[addr]) return cb(null, ab[addr]);

      storageService.getAddressbook('livenet', function(err, ab) {
        if (err) return cb(err);
        if (ab) ab = JSON.parse(ab);
        if (ab && ab[addr]) return cb(null, ab[addr]);
        return cb();
      });
    });
  };

  root.list = function(cb) {
    storageService.getAddressbook('testnet', function(err, ab) {
      if (err) return cb('Could not get the Addressbook');

      if (ab) ab = JSON.parse(ab);

      ab = ab || {};
      storageService.getAddressbook('livenet', function(err, ab2) {
        if (ab2) ab2 = JSON.parse(ab2);

        ab2 = ab2 || {};
        return cb(err, lodash.defaults(ab2, ab));
      });
    });
  };

  root.add = function(entry, cb) {
    var network = (new bitcore.Address(entry.address)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isArray(ab)) ab = {}; // No array
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry;
      storageService.setAddressbook(network, JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.remove = function(addr, cb) {
    var network = (new bitcore.Address(addr)).network.name;
    storageService.getAddressbook(network, function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isEmpty(ab)) return cb('Addressbook is empty');
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(network, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function() {
    storageService.removeAddressbook('livenet', function(err) {
      storageService.removeAddressbook('testnet', function(err) {
        if (err) return cb('Error deleting addressbook');
        return cb();
      });
    });
  };

  return root;
});
