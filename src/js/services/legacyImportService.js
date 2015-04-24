'use strict';
angular.module('copayApp.services')
  .factory('legacyImportService', function($rootScope, $log, $timeout, $http, lodash, bitcore, bwcService, sjcl, profileService, isChromeApp) {

    var root = {};
    var wc = bwcService.getClient();

    root.getKeyForEmail = function(email) {
      var hash = bitcore.crypto.Hash.sha256ripemd160(new bitcore.deps.Buffer(email)).toString('hex');
      $log.debug('Storage key:' + hash);
      return 'profile::' + hash;
    };

    root.getKeyForWallet = function(id) {
      return 'wallet::' + id;
    };

    root._importOne = function(user, pass, walletId, get, cb) {
      get(root.getKeyForWallet(walletId), function(err, blob) {
        if (err) {
          $log.warn('Could not fetch wallet: ' + walletId + ":" + err);
          return cb('Could not fetch ' + walletId);
        }
        profileService.importLegacyWallet(user, pass, blob, cb);
      });
    };


    root._doImport = function(user, pass, get, cb) {
      var self = this;
      get(root.getKeyForEmail(user), function(err, p) {
        if (err || !p)
          return cb(err || ('Could not find profile for ' + user));


        var ids = wc.getWalletIdsFromOldCopay(user, pass, p);
        if (!ids)
          return cb('Could not find wallets on the profile');

        $rootScope.$emit('Local/ImportStatusUpdate',
          'Found ' + ids.length + ' wallets to import:' + ids.join());

        $log.info('Importing Wallet Ids:', ids);

        var i = 0;
        var okIds = [];
        var toScanIds = [];
        lodash.each(ids, function(walletId) {
          $timeout(function() {
            $rootScope.$emit('Local/ImportStatusUpdate',
              'Importing wallet ' + walletId + ' ... ');

            self._importOne(user, pass, walletId, get, function(err, id, name, existed) {
              if (err) {
                $rootScope.$emit('Local/ImportStatusUpdate',
                  'Failed to import wallet ' + (name || walletId));
              } else {
                okIds.push(walletId);
                $rootScope.$emit('Local/ImportStatusUpdate',
                  'Wallet ' + id + '[' + name + '] imported successfully');

                if (!existed) {
                  $log.info('Wallet ' + walletId + ' was created. need to be scanned');
                  toScanIds.push(id);
                }
              }

              if (++i == ids.length) {
                return cb(null, okIds, toScanIds);
              }
            });
          }, 100);
        });
      });
    };

    root.import = function(user, pass, serverURL, fromCloud, cb) {

      var insightGet = function(key, cb) {


        var kdfbinary = function(password, salt, iterations, length) {
          iterations = iterations || defaultIterations;
          length = length || 512;
          salt = sjcl.codec.base64.toBits(salt || defaultSalt);

          var hash = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(password));
          var prff = function(key) {
            return new sjcl.misc.hmac(hash, sjcl.hash.sha1);
          };

          return sjcl.misc.pbkdf2(hash, salt, iterations, length, prff);
        };

        var salt = 'jBbYTj8zTrOt6V';
        var iter = 1000;
        var SEPARATOR = '|';

        var kdfb = kdfbinary(pass + SEPARATOR + user, salt, iter);
        var kdfb64 = sjcl.codec.base64.fromBits(kdfb);


        var keyBuf = new bitcore.deps.Buffer(kdfb64);
        var passphrase = bitcore.crypto.Hash.sha256sha256(keyBuf).toString('base64');
        var authHeader = new bitcore.deps.Buffer(user + ':' + passphrase).toString('base64');
        var retrieveUrl = serverURL + '/retrieve';
        var getParams = {
          method: 'GET',
          url: retrieveUrl + '?key=' + encodeURIComponent(key) + '&rand=' + Math.random(),
          headers: {
            'Authorization': authHeader,
          },
        };
        $log.debug('Insight GET', getParams);

        $http(getParams)
          .success(function(data) {
            data = JSON.stringify(data);
            $log.info('Fetch from insight OK:' + getParams.url);
            return cb(null, data);
          })
          .error(function() {
            $log.warn('Failed to fetch from insight');
            return cb('PNOTFOUND: Profile not found');
          });
      };

      var localStorageGet = function(key, cb) {
        if (isChromeApp) {
          chrome.storage.local.get(key,
            function(data) {
              return cb(null, data[key]);
            });
        } else {
          var v = localStorage.getItem(key);
          return cb(null, v);
        }
      };

      var get = fromCloud ? insightGet : localStorageGet;

      root._doImport(user, pass, get, cb);
    };

    return root;
  });
