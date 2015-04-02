'use strict';
angular.module('copayApp.services')
  .factory('legacyImportService', function($rootScope, $log, $timeout, $http, lodash, bitcore, bwcService, profileService, notification) {

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


    root._doImport = function(user, pass, get, cb) {
      get(root.getKeyForEmail(user), function(p) {
        if (!p)
          return cb('Could not find profile for ' + user);

        var ids = wc.getWalletIdsFromOldCopay(user, pass, p);
        if (!ids)
          return cb('Could not find wallets on the profile');

        $rootScope.$emit('Local/ImportStatusUpdate',
          'Found ' + ids.length + ' wallets to import:' + ids.join());

        $log.info('Importing Wallet Ids:', ids);

        var i = 0;
        var okIds = [];
        lodash.each(ids, function(walletId) {

          $timeout(function() {
            $rootScope.$emit('Local/ImportStatusUpdate',
              'Importing wallet ' + walletId + ' ... ');

            get(root.getKeyForWallet(walletId), function(blob) {
              profileService.importLegacyWallet(user, pass, blob, function(err, name) {
                if (err) {
                  $rootScope.$emit('Local/ImportStatusUpdate',
                    'Failed to import wallet ' + (name || walletId));
                } else {
                  okIds.push(walletId);
                  console.log('[legacyImportService.js.47:okIds:]', okIds); //TODO
                  $rootScope.$emit('Local/ImportStatusUpdate',
                    'Wallet ' + name + ' imported successfully');

                }
                i++;
                if (i == ids.length) {
                  return cb(null, okIds);
                }
              })
            });
          }, 100);
        });
      });
    };

    root.import = function(user, pass, serverURL, fromCloud, cb) {

      var insightGet = function(key, cb) {
        $log.warn('Insight get not implemented')

        var authHeader = new bitcore.deps.Buffer(user + ':' + pass).toString('base64');
        var retrieveUrl = serverURL + '/retrieve';
        var getParams = {
          url: retrieveUrl + '?' + querystring.encode({
            key: key,
            rand: Math.random() // prevent cache
          }),
          headers: {
            'Authorization': authHeader
          }
        };

        console.log('[legacyImportService.js.71:getParams:]', getParams); //TODO
        this.request.get(getParams,
          function(err, response, body) {
            if (err) {
              return cb('Connection error');
            }
            if (response.statusCode === 403) {
              return cb('PNOTFOUND: Profile not found');
            }
            if (response.statusCode !== 200) {
              return cb('Unable to read item from insight');
            }
            return cb(null, body);
          }
        );
      };

      var localStorageGet = function(key, cb) {
        var v = localStorage.getItem(key);
        return cb(v);
      };

      var get = fromCloud ? insightGet : localStorageGet;

      root._doImport(user, pass, get, cb);
    };

    return root;
  });
