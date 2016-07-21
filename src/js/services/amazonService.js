'use strict';

angular.module('copayApp.services').factory('amazonService', function($http, $log, lodash, moment, storageService, configService, platformInfo) {
  var root = {};
  var credentials = {};

  root.setCredentials = function(network) {
    if (network == 'testnet') {
      credentials.BITPAY_API_URL = window.amazon_sandbox_bitpay_api_url;
      credentials.BITPAY_API_TOKEN = window.amazon_sandbox_bitpay_api_token;
    } else {
      credentials.BITPAY_API_URL = window.amazon_bitpay_api_url;
      credentials.BITPAY_API_TOKEN = window.amazon_bitpay_api_token;
    };
  };

  var _getUuid = function(cb) {
    var isCordova = platformInfo.isCordova;

    if (isCordova) {
      window.plugins.uniqueDeviceID.get(function(uuid) {
        return cb(uuid);
      }, function(err) {
        $log.error(err);
        return cb();
      });
    } else {
      return cb('XXX'); // Test purpose
    }
  };

  var _getBitPay = function(endpoint) {
    return {
      method: 'GET',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    data.token = credentials.BITPAY_API_TOKEN;
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.savePendingGiftCard = function(gc, opts, cb) {
    var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
    storageService.getAmazonGiftCards(network, function(err, oldGiftCards) {
      if (lodash.isString(oldGiftCards)) {
        oldGiftCards = JSON.parse(oldGiftCards);
      }
      if (lodash.isString(gc)) {
        gc = JSON.parse(gc);
      }
      var inv = oldGiftCards || {};
      inv[gc.invoiceId] = gc;
      if (opts && (opts.error || opts.status)) {
        inv[gc.invoiceId] = lodash.assign(inv[gc.invoiceId], opts);
      }
      if (opts && opts.remove) {
        delete(inv[gc.invoiceId]);
      }
      inv = JSON.stringify(inv);

      storageService.setAmazonGiftCards(network, inv, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingGiftCards = function(cb) {
    var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
    storageService.getAmazonGiftCards(network, function(err, giftCards) {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(err, _gcds);
    });
  };

  root.createBitPayInvoice = function(data, cb) {
    _getUuid(function(uuid) {
      if (lodash.isEmpty(uuid)) return cb('CAN_NOT_GET_UUID');
      var dataSrc = {
        currency: data.currency,
        amount: data.amount,
        clientId: uuid
      };

      $http(_postBitPay('/amazon-gift/pay', dataSrc)).then(function(data) {
        $log.info('BitPay Create Invoice: SUCCESS');
        return cb(null, data.data);
      }, function(data) {
        $log.error('BitPay Create Invoice: ERROR ' + data.data.message);
        return cb(data.data);
      });
    });
  };

  root.getBitPayInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      $log.error('BitPay Get Invoice: ERROR ' + data.data.error);
      return cb(data.data.error);
    });
  };

  root.createGiftCard = function(dataInvoice, cb) {
    _getUuid(function(uuid) {
      var dataSrc = {
        "clientId": uuid,
        "invoiceId": dataInvoice.invoiceId,
        "accessKey": dataInvoice.accessKey
      };

      $http(_postBitPay('/amazon-gift/redeem', dataSrc)).then(function(data) {
        var status = data.data.status == ('new' || 'paid') ? 'PENDING' : data.data.status;
        data.data.status = status;
        data.data.clientId = uuid;
        $log.info('Amazon.com Gift Card Create/Update: ' + status);
        return cb(null, data.data);
      }, function(data) {
        $log.error('Amazon.com Gift Card Create/Update: ' + data.data.message);
        return cb(data.data);
      });
    })

  };
  return root;

});
