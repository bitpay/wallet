'use strict';

angular.module('copayApp.services').factory('addressbookService', function(storageService, lodash, $log, networkService) {
  var root = {};

  ///////////////////////////////////////////////////////////////////////////
  // TODO: remove in future release
  // Migrate addressbook format
  var tryToMigrate = function() {
    checkLegacy(function(hasLegacy) {
      if (!hasLegacy) return;

      listLegacy(function(err, ab) {
        if (err) {
          return $log.warn('Could not migrate addressbook format: ' + err);
        }
        lodash.forEach(Object.keys(ab), function(addr) {
          // Assign network URI to each entry.
          // Okay to use /btc bitcore here since all legacy addresses are bitcoin addresses.
          ab[addr].networkURI = networkService.bwcFor('livenet/btc').getBitcore().Address(addr).network.name + '/btc';
        });
        storageService.setAddressbook(JSON.stringify(ab), function(err, ab) {
          if (err) {
            return $log.warn('Could not migrate addressbook format: ' + err);
          } else {
            removeAllLegacy(function(err) {
              if (err) {
                $log.warn('Could not delete legacy addressbook: ' + err);
              }

              root.list(function(err, ab) {
                if (err) {
                  $log.warn('Could not read addressbook after migration: ' + err);
                }
                if (ab != {}) {
                  $log.info('Addressbook successfully migrated');
                }
              });
            });
          }
        });
      });
    });
  };

  var checkLegacy = function(cb) {
    storageService.getAddressbookLegacy('testnet', function(err, ab) {
      if (err) return cb('Could not get the Addressbook');
      storageService.getAddressbookLegacy('livenet', function(err, ab2) {
        if (err) return cb('Could not get the Addressbook');
        return cb(ab != null || ab2 != null);
      });
    });
  };

  var listLegacy = function(cb) {
    storageService.getAddressbookLegacy('testnet', function(err, ab) {
      if (err) return cb('Could not get the Addressbook');

      if (ab) ab = JSON.parse(ab);

      ab = ab || {};
      storageService.getAddressbookLegacy('livenet', function(err, ab2) {
        if (ab2) ab2 = JSON.parse(ab2);

        ab2 = ab2 || {};
        return cb(err, lodash.defaults(ab2, ab));
      });
    });
  };

  var removeAllLegacy = function(cb) {
    storageService.removeAddressbookLegacy('livenet', function(err) {
      storageService.removeAddressbookLegacy('testnet', function(err) {
        return cb(err);
      });
    });
  };

  tryToMigrate();
  //
  ///////////////////////////////////////////////////////////////////////////

  root.get = function(addr, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      if (ab && ab[addr]) return cb(null, ab[addr]);
      return cb();
    });
  };

  root.list = function(cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) return cb('Could not get the Addressbook');
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      return cb(err, ab);
    });
  };

  root.add = function(entry, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isArray(ab)) ab = {}; // No array
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry;
      storageService.setAddressbook(JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.remove = function(addr, cb) {
    storageService.getAddressbook(function(err, ab) {
      if (err) return cb(err);
      if (ab) ab = JSON.parse(ab);
      ab = ab || {};
      if (lodash.isEmpty(ab)) return cb('Addressbook is empty');
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function(cb) {
    storageService.removeAddressbook(function(err) {
      if (err) return cb('Error deleting addressbook');
      return cb();
    });
  };

  return root;
});
