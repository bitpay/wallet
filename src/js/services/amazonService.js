'use strict';
angular.module('copayApp.services').factory('amazonService', function($http, $log, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  root.limitPerDay = 2000;

  /*
   * Development: 'testnet'
   * Production: 'livenet'
   */
  credentials.NETWORK = 'livenet';
  //credentials.NETWORK = 'testnet';

  if (credentials.NETWORK == 'testnet') {
    credentials.BITPAY_API_URL = "https://test.bitpay.com";
  } else {
    credentials.BITPAY_API_URL = "https://bitpay.com";
  };

  var homeItem = {
    name: 'amazon',
    title: 'Amazon.com Gift Cards',
    icon: 'icon-amazon',
    sref: 'tabs.giftcards.amazon',
  };

  var nextStepItem = {
    name: 'amazon',
    title: 'Buy Amazon.com Gift Cards',
    icon: 'icon-amazon',
    sref: 'tabs.giftcards.amazon',
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
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.getNetwork = function() {
    return credentials.NETWORK;
  };

  root.savePendingGiftCard = function(gc, opts, cb) {
    var network = root.getNetwork();
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

        homeIntegrationsService.register(homeItem);
        nextStepsService.unregister(nextStepItem.name);
        return cb(err);
      });
    });
  };

  root.getPendingGiftCards = function(cb) {
    var network = root.getNetwork();
    storageService.getAmazonGiftCards(network, function(err, giftCards) {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(err, _gcds);
    });
  };

  root.createBitPayInvoice = function(data, cb) {

    var dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      email: data.email
    };

    $http(_postBitPay('/amazon-gift/pay', dataSrc)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR ' + data.data.message);
      return cb(data.data);
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

  root.createGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/redeem', dataSrc)).then(function(data) {
      var status = data.data.status == 'new' ? 'PENDING' : (data.data.status == 'paid') ? 'PENDING' : data.data.status;
      data.data.status = status;
      $log.info('Amazon.com Gift Card Create/Update: ' + status);
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Create/Update: ' + data.data.message);
      return cb(data.data);
    });
  };

  root.cancelGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/cancel', dataSrc)).then(function(data) {
      $log.info('Amazon.com Gift Card Cancel: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Cancel: ' + data.data.message);
      return cb(data.data);
    });
  };

  var register = function() {
    storageService.getAmazonGiftCards(root.getNetwork(), function(err, giftCards) {
      if (giftCards) {
        homeIntegrationsService.register(homeItem);
      } else {
        nextStepsService.register(nextStepItem);
      }
    });
  };

  register();
  return root;
});
