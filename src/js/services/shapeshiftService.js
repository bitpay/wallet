'use strict';
angular.module('copayApp.services').factory('shapeshiftService', function($http, $log, $window, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  // (Optional) Affiliate PUBLIC KEY, for volume tracking, affiliate payments, split-shifts, etc.
  if ($window.externalServices && $window.externalServices.shapeshift) {
    credentials.API_KEY = $window.externalServices.shapeshift.api_key || null;
  }

  /*
   * Development: 'testnet'
   * Production: 'livenet'
   */
  credentials.NETWORK = 'livenet';
  //credentials.NETWORK = 'testnet';

  if (credentials.NETWORK == 'testnet') {
    credentials.API_URL = "";
  } else {
    // CORS: cors.shapeshift.io
    credentials.API_URL = "https://shapeshift.io";
  }

  var homeItem = {
    name: 'shapeshift',
    title: 'ShapeShift',
    icon: 'icon-shapeshift',
    sref: 'tabs.shapeshift',
  };

  var _get = function(endpoint) {
    return {
      method: 'GET',
      url: credentials.API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _post = function(endpoint, data) {
    return {
      method: 'POST',
      url: credentials.API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.getNetwork = function() {
    return credentials.NETWORK;
  };

  root.shift = function(data, cb) {

    var dataSrc = {
      withdrawal: data.withdrawal,
      pair: data.pair,
      returnAddress: data.returnAddress,
      apiKey: credentials.API_KEY
    };

    $http(_post('/shift', dataSrc)).then(function(data) {
      $log.info('Shapeshift SHIFT: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Shapeshift SHIFT ERROR', data);
      return cb(data);
    });
  };

  root.saveShapeshift = function(data, opts, cb) {
    var network = root.getNetwork();
    storageService.getShapeshift(network, function(err, oldData) {
      if (lodash.isString(oldData)) {
        oldData = JSON.parse(oldData);
      }
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      var inv = oldData || {};
      inv[data.address] = data;
      if (opts && (opts.error || opts.status)) {
        inv[data.address] = lodash.assign(inv[data.address], opts);
      }
      if (opts && opts.remove) {
        delete(inv[data.address]);
      }

      inv = JSON.stringify(inv);


      storageService.setShapeshift(network, inv, function(err) {
        homeIntegrationsService.register(homeItem);
        nextStepsService.unregister(homeItem.name);
        return cb(err);
      });
    });
  };

  root.getShapeshift = function(cb) {
    var network = root.getNetwork();
    storageService.getShapeshift(network, function(err, ss) {
      var _gcds = ss ? JSON.parse(ss) : null;
      return cb(err, _gcds);
    });
  };

  root.getRate = function(pair, cb) {
    $http(_get('/rate/' + pair)).then(function(data) {
      $log.info('Shapeshift PAIR: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Shapeshift PAIR ERROR', data);
      return cb(data);
    });
  };

  root.getLimit = function(pair, cb) {
    $http(_get('/limit/' + pair)).then(function(data) {
      $log.info('Shapeshift LIMIT: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Shapeshift LIMIT ERROR', data);
      return cb(data);
    });
  };

  root.getMarketInfo = function(pair, cb) {
    $http(_get('/marketinfo/' + pair)).then(function(data) {
      $log.info('Shapeshift MARKET INFO: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Shapeshift MARKET INFO ERROR', data);
      return cb(data);
    });
  };

  root.getStatus = function(addr, cb) {
    $http(_get('/txStat/' + addr)).then(function(data) {
      $log.info('Shapeshift STATUS: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Shapeshift STATUS ERROR', data);
      return cb(data);
    });
  };

  var register = function() {
    storageService.getShapeshift(root.getNetwork(), function(err, ss) {
      if (ss) {
        homeIntegrationsService.register(homeItem);
      } else {
        nextStepsService.register(homeItem);
      }
    });
  };

  register();
  return root;
});
