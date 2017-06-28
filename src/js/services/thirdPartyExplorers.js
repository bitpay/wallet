'use strict';

angular.module('copayApp.services').factory('thirdPartyExplorersService', function thirdPartyExplorersServiceFactory($log, $http, lodash, configService) {
  var STATUS_OK = 'success';
  var STATUS_NOT_AVAILABLE = 'notAvailable';
  var STATUS_NOT_MATCH = 'notMatch';
  var STATUS_NOT_FOUND = 'notFound';
  var root = {};

  root.getAvailableServices = function() {
    return lodash.map(lodash.keys(explorers), function(serviceName) {
      return {
        name: serviceName
      };
    });
  };

  var getStatusFromBlockchainInfo = function(amount, addrs, params) {
    var txOuts = [];
    lodash.each(resp.data.out, function(out) {
      txOuts.push({
        address: out.addr,
        amount: parseInt(out.value)
      });
    });
    var match;
    lodash.each(txOuts, function(out) {
      if (lodash.includes(addrs, out.address)) match = out.amount == amount;
    });
    return match ? STATUS_OK : STATUS_NOT_MATCH;
  };

  var getStatusFromBlockrIo = function(amount, addrs, params) {
    var settings = configService.getSync().wallet.settings;
    var unitToSatoshi = settings.unitToSatoshi;
    var txOuts = [];
    lodash.each(params.data.data.vouts, function(out) {
      txOuts.push({
        address: out.address,
        amount: parseInt(out.amount * unitToSatoshi)
      });
    });
    var match;
    lodash.each(txOuts, function(out) {
      if (lodash.includes(addrs, out.address)) match = out.amount == amount;
    });
    return match ? STATUS_OK : STATUS_NOT_MATCH;
  };

  var explorers = {
    'Blockchain.info': {
      url: 'https://blockchain.info/es/rawtx/',
      getStatus: getStatusFromBlockchainInfo,
    },
    'Blockr.io': {
      url: 'http://btc.blockr.io/api/v1/tx/info/',
      getStatus: getStatusFromBlockrIo,
    }
  };

  root.verifyTx = function(tx, addrs, cb) {
    var i = 0;
    var result = [];
    var keys = lodash.keys(explorers);

    lodash.each(keys, function(k) {
      var service = explorers[k];
      var normalizedResp = {};

      requestTx(service.url + tx.txid, function(err, resp) {
        normalizedResp.serviceName = k;

        if (err) {
          if (err.status == 404) normalizedResp.status = STATUS_NOT_FOUND;
          else normalizedResp.status = STATUS_NOT_AVAILABLE;
        } else
          normalizedResp.status = service.getStatus(tx.amount, addrs, resp);

        result.push(normalizedResp);
        if (++i == keys.length) return cb(result);
      });
    });
  };

  function requestTx(url, cb) {
    $log.debug('Retrieving tx information...');

    var request = {
      url: url,
      method: 'GET',
      json: true
    };

    $http(request).then(function(resp) {
      $log.debug('Tx params:', resp);
      return cb(null, resp);
    }, function(err) {
      return cb(err);
    });
  };

  return root;
});
