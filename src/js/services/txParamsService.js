'use strict';

angular.module('copayApp.services').factory('txParamsService', function txParamsServiceFactory($log, $http, configService) {

  var root = {};

  root.getTxParams = function(from, txid, cb) {
    if (from == 'blockchainInfo') {
      requestTxParams('https://blockchain.info/es/rawtx/' + txid, function(err, resp) {
        if (err) return cb(err);
        console.log('### BLOCKCHAIN');
        var params = {
          from: from,
          amount: resp.data.out[0].value,
          address: resp.data.out[0].addr,
          fee: 'TODO'
        };
        return cb(null, params);
      });
    } else {
      requestTxParams('http://btc.blockr.io/api/v1/tx/info/' + txid, function(err, resp) {
        if (err) return cb(err);
        console.log('### BLOCKRIO');
        console.log(JSON.stringify(resp.data));
        console.log(JSON.stringify(resp.data.data.vouts));
        var config = configService.getSync().wallet.settings;
        var unitToSatoshi = config.unitToSatoshi;
        var params = {
          from: from,
          amount: resp.data.data.vouts[0].amount * unitToSatoshi,
          address: resp.data.data.vouts[0].address,
          fee: resp.data.data.fee
        };
        return cb(null, params);
      });
    }
  };

  function requestTxParams(txParamsURL, cb) {
    $log.debug('Retrieving tx information...');

    var request = {
      url: txParamsURL,
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
