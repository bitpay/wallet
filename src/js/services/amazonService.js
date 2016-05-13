'use strict';

angular.module('copayApp.services').factory('amazonService', function($http, $log, isCordova, lodash, storageService, configService) {
  var root = {};
  var credentials = {};

  var fakeData = {
    "cardInfo": {
      "cardNumber":null,
      "cardStatus":"RefundedToPurchaser",
      "expirationDate":null,
      "value":{
        "amount":1.0,
        "currencyCode":"USD"
      }
    },
    "creationRequestId":"AwssbTSpecTest001",
    "gcClaimCode":"Z7NV-LBBG39-75MU",
    "gcExpirationDate":null,
    "gcId":"A2GCN9BRX5QS76",
    "status":"SUCCESS",
    "bitpayInvoiceId":"NJtevvEponHbQVmYoL7FYp" 
  };

  root.setCredentials = function(network) {

    if (network == 'testnet') {
      credentials.BITPAY_API = 'https://test.bitpay.com';
      credentials.BITPAY_API_TOKEN = 'GDtYwBqbMZvjz5JrYZ1d2ba96StV92U4Yg4AGhT3C4He';
      credentials.AMAZON_HOST = 'https://agcod-v2-gamma.amazon.com';
    }
    else {
      credentials.BITPAY_API = 'https://bitpay.com';
      credentials.BITPAY_API_TOKEN = window.bitpay_token;
      credentials.AMAZON_HOST = 'https://agcod-v2.amazon.com';
    };
  };

  var _getBitPay = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.BITPAY_API + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    data.token = credentials.BITPAY_API_TOKEN;
    return {
      method: 'POST',
      url: credentials.BITPAY_API + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  }; 

  root.createBitPayInvoice = function(data, cb) {
    var data = {
      price: data.price,
      currency: data.currency
    };
    $http(_postBitPay('/invoices', data)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR ' + data.statusText);
      return cb(data);
    });
  };

  root.saveGiftCard = function(gc, opts, cb) {
    var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
    storageService.getAmazonGiftCards(network, function(err, oldGiftCards) {
      if (lodash.isString(oldGiftCards)) {
        oldGiftCards = JSON.parse(oldGiftCards);
      }
      if (lodash.isString(gc)) {
        gc = JSON.parse(gc);
      }
      var inv = oldGiftCards || {};
      inv[gc.gcId] = gc;
      if (opts && (opts.error || opts.status)) {
        inv[gc.gcId] = lodash.assign(inv[gc.gcId], opts);
      }
      if (opts && opts.remove) {
        delete(inv[gc.gcId]);
      }
      inv = JSON.stringify(inv);

      storageService.setAmazonGiftCards(network, inv, function(err) {
        return cb(err);
      });
    });
  };

  root.getGiftCards = function(cb) {
    var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet'; 
    storageService.getAmazonGiftCards(network, function(err, giftCards) {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(err, _gcds);
    });
  };

  root.buyGiftCard = function(gift, cb) {
    var newId = Math.floor(Date.now() / 1000);
    var saveData = fakeData;
    saveData.gcId = saveData.gcId + '' + newId;
    saveData.cardInfo.value.amount = gift.amount;
    saveData.cardInfo.value.currencyCode = gift.currencyCode;
    saveData['bitpayInvoiceId'] = gift.bitpayInvoiceId;
    saveData['date'] = newId;
    root.saveGiftCard(saveData, null, function(err) {
      return cb(null, fakeData);
    });
  };

  return root;

});
