'use strict';

angular.module('copayApp.services').factory('verifyByThirdPartyService', function verifyByThirdPartyServiceFactory($log, $http, lodash, configService) {
  var STATUS_OK = 'success';
  var STATUS_NA = 'N/A';
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
    return match ? STATUS_OK : STATUS_NA;
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
    return match ? STATUS_OK : STATUS_NA;
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

  root.getTx = function(tx, addrs, cb) {
    var i = 0;
    var result = [];
    var keys = lodash.keys(explorers);

    lodash.each(keys, function(k) {
      var service = explorers[k];
      var normalizedResp = {};

      requestTx(service.url + tx.txid, function(resp) {
        normalizedResp.serviceName = k;

        var hasError = resp.status == STATUS_NOT_FOUND || resp.status == STATUS_NA;
        normalizedResp.status = hasError ? resp.status : service.getStatus(tx.amount, addrs, resp);
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
      return cb(resp);
    }, function(err) {
      return cb({
        status: err.status == 404 ? STATUS_NOT_FOUND : STATUS_NA
      });
    });
  };

  return root;
});
