'use strict';

angular.module('copayApp.services').factory('verifyByThirdPartyService', function verifyByThirdPartyServiceFactory($log, $http, lodash, configService) {

  var root = {};

  root.getTx = function(service, txid, cb) {
    return explorers[service.name].getTx(txid, cb);
  };

  var getTxFromBlockchainInfo = function(txid, cb) {
    var service = lodash.find(configService.getDefaults().blockExplorerServices, function(s) {
      return (s.name == 'Blockchain.info');
    });

    requestTx(service.name, service.url + txid, function(err, resp) {
      if (err) return cb(err);
      if (resp.notFound) return cb(null, resp);

      var params = {};
      params.name = service.name;
      params.notFound = resp.data.status == 404;
      params.success = resp.data.status == 200;
      params.amount = 0;
      params.address = [];
      lodash.each(resp.data.out, function(out) {
        params.amount += parseInt(out.value);
        params.address.push(out.addr);
      });
      return cb(null, params);
    });
  };

  var getTxFromBlockrIo = function(txid, cb) {
    var service = lodash.find(configService.getDefaults().blockExplorerServices, function(s) {
      return (s.name == 'Blockr.io');
    });
    requestTx(service.name, service.url + txid, function(err, resp) {
      if (err) return cb(err);
      if (resp.notFound) return cb(null, resp);

      var settings = configService.getSync().wallet.settings;
      var unitToSatoshi = settings.unitToSatoshi;
      var params = {};
      params.name = service.name;
      params.notFound = resp.status == 404;
      params.success = resp.status == 200;
      params.amount = 0;
      params.address = [];
      lodash.each(resp.data.data.vouts, function(out) {
        params.amount += parseInt(out.amount * unitToSatoshi);
        params.address.push(out.address);
      });
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

  function requestTx(serviceName, url, cb) {
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
      if (err.status == 404) return cb(null, {
        name: serviceName,
        notFound: true
      });
      return cb(err);
    });
  };

  return root;
});
