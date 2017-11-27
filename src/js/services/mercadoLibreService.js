'use strict';
angular.module('copayApp.services').factory('mercadoLibreService', function($http, $log, lodash, moment, storageService, configService, platformInfo, nextStepsService, homeIntegrationsService) {
  var root = {};
  var credentials = {};

  // Not used yet
  var availableCountries = [{
    'country': 'Brazil',
    'currency': 'BRL',
    'name': 'Mercado Livre',
    'url': 'https://www.mercadolivre.com.br'
  }];

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
    name: 'mercadoLibre',
    title: 'Vales-Presente do Mercado Livre Brasil',
    icon: 'icon-ml',
    sref: 'tabs.giftcards.mercadoLibre',
  };

  var nextStepItem = {
    name: 'mercadoLibre',
    title: 'Comprar um Vale-Presente Mercado Livre',
    icon: 'icon-ml',
    sref: 'tabs.giftcards.mercadoLibre',
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
    storageService.getMercadoLibreGiftCards(network, function(err, oldGiftCards) {
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


      storageService.setMercadoLibreGiftCards(network, inv, function(err) {

        homeIntegrationsService.register(homeItem);
        nextStepsService.unregister(nextStepItem.name);
        return cb(err);
      });
    });
  };

  root.getPendingGiftCards = function(cb) {
    var network = root.getNetwork();
    storageService.getMercadoLibreGiftCards(network, function(err, giftCards) {
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

    $http(_postBitPay('/mercado-libre-gift/pay', dataSrc)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR', JSON.stringify(data.data));
      return cb(data.data);
    });
  };

  root.getBitPayInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      $log.error('BitPay Get Invoice: ERROR', JSON.stringify(data.data));
      return cb(data.data);
    });
  };

  root.createGiftCard = function(data, cb) {
    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/mercado-libre-gift/redeem', dataSrc)).then(function(data) {
      var status = data.data.status == 'new' ? 'PENDING' : (data.data.status == 'paid') ? 'PENDING' : data.data.status;
      data.data.status = status;
      $log.info('Mercado Libre Gift Card Create/Update: ' + status);
      return cb(null, data.data);
    }, function(data) {
      $log.error('Mercado Libre Gift Card Create/Update: ERROR', JSON.stringify(data.data));
      return cb(data.data);
    });
  };

  /*
   * Disabled for now *
   */
  /*
  root.cancelGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/mercado-libre-gift/cancel', dataSrc)).then(function(data) {
      $log.info('Mercado Libre Gift Card Cancel: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Mercado Libre Gift Card Cancel: ' + data.data.message);
      return cb(data.data);
    });
  };
  */

  var register = function() {
    storageService.getMercadoLibreGiftCards(root.getNetwork(), function(err, giftCards) {
      if (giftCards) {
        homeIntegrationsService.register(homeItem);
      } else {
        nextStepsService.register(nextStepItem);
      }
    });
  };

  // Hide Mercado Libre
  register();
  return root;
});
