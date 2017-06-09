'use strict';

angular.module('copayApp.services').factory('blockExplorerService', function blockExplorerServiceFactory($log, $http, lodash, configService) {

  var root = {};

  root.getTx = function(service, txid, cb) {
    return explorers[service.name].getTx(txid, cb);
  };

  var getTxFromBlockchainInfo = function(txid, cb) {
    var service = lodash.find(configService.getDefaults().blockExplorerServices, function(s) {
      return (s.name == 'Blockchain.info');
    });

    requestTx(service.url + txid, function(err, resp) {
      if (err) return cb(err);

      var params = {};
      params.name = service.name;
      params.notFound = resp.data.status == 404;
      params.success = resp.data.status == 200;
      params.amount = resp.data.out[0].value;
      params.address = resp.data.out[0].addr;
      return cb(null, params);
    });
  };

  var getTxFromBlockrIo = function(txid, cb) {
    var service = lodash.find(configService.getDefaults().blockExplorerServices, function(s) {
      return (s.name == 'Blockr.io');
    });
    requestTx(service.url + txid, function(err, resp) {
      if (err) return cb(err);

      var settings = configService.getSync().wallet.settings;
      var unitToSatoshi = settings.unitToSatoshi;
      var params = {};
      params.name = service.name;
      params.notFound = resp.status == 404;
      params.success = resp.status == 200;
      params.amount = resp.data.data.vouts[0].amount * unitToSatoshi;
      params.address = resp.data.data.vouts[0].address;
      return cb(null, params);
    });
  };

  var explorers = {
    'Blockchain.info': {
      getTx: getTxFromBlockchainInfo,
    },
    'Blockr.io': {
      getTx: getTxFromBlockrIo,
    }
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
