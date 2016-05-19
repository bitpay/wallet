'use strict';

angular.module('copayApp.services').factory('amazonService', function($http, $log, isCordova, lodash, moment, storageService, configService) {
  var root = {};
  var credentials = {};

  root.setCredentials = function(network) {
    credentials.AMAZON_SANDBOX = network == 'testnet' ? true : false;
    credentials.AMAZON_SERVICE_NAME = 'AGCODService';

    if (network == 'testnet') {
      credentials.BITPAY_API_URL = window.amazon_sandbox_bitpay_api_url;
      credentials.BITPAY_API_TOKEN = window.amazon_sandbox_bitpay_api_token;
      credentials.AMAZON_ACCESS_KEY = window.amazon_sandbox_access_key;
      credentials.AMAZON_SECRET_KEY = window.amazon_sandbox_secret_key;
      credentials.AMAZON_PARTNER_ID = window.amazon_sandbox_partner_id;
      credentials.AMAZON_REGION = window.amazon_sandbox_region;
      credentials.AMAZON_ENDPOINT = window.amazon_sandbox_endpoint;
    }
    else {
      credentials.BITPAY_API_URL = window.amazon_bitpay_api_url;
      credentials.BITPAY_API_TOKEN = window.amazon_bitpay_api_token;
      credentials.AMAZON_ACCESS_KEY = window.amazon_access_key;
      credentials.AMAZON_SECRET_KEY = window.amazon_secret_key;
      credentials.AMAZON_PARTNER_ID = window.amazon_partner_id;
      credentials.AMAZON_REGION = window.amazon_region;
      credentials.AMAZON_ENDPOINT = window.amazon_endpoint;
    };
  };

  var _getSignatureKey = function() {

    var key = credentials.AMAZON_SECRET_KEY;
    var dateStamp = moment.utc().format('YYYYMMDD');
    var regionName = credentials.AMAZON_REGION;
    var serviceName = credentials.AMAZON_SERVICE_NAME;

    var kDate= CryptoJS.HmacSHA256(dateStamp, "AWS4" + key, { asBytes: true});
    var kRegion= CryptoJS.HmacSHA256(regionName, kDate, { asBytes: true });
    var kService=CryptoJS.HmacSHA256(serviceName, kRegion, { asBytes: true });
    var kSigning= CryptoJS.HmacSHA256("aws4_request", kService, { asBytes: true });

    return kSigning;
  }

  
  var _getHeaders = function(data, method, endpoint, amz_target) {
    var content_type = 'application/json';
    var accept = 'application/json';
    var amz_date = moment.utc().format('YYYYMMDD[T]HHmmss[Z]');
    var date_stamp = moment.utc().format('YYYYMMDD');
    var canonical_querystring = '';

    /************* TASK 1: CREATE A CANONICAL REQUEST *************/

    var canonical_headers = 
      'accept:' + accept + '\n' + 
      'content-type:' + content_type + '\n' + 
      'host:' + credentials.AMAZON_ENDPOINT.replace('https://', '') + '\n' + 
      'x-amz-date:' + amz_date + '\n' + 
      'x-amz-target:' + amz_target + '\n';    
    
    var signed_headers = 'accept;content-type;host;x-amz-date;x-amz-target';
    data = JSON.stringify(data);
    var payload_hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
    var canonical_request = method + '\n' + endpoint + '\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash;

    /************* TASK 2: CREATE THE STRING TO SIGN *************/

    var algorithm = 'AWS4-HMAC-SHA256';
    var credential_scope = date_stamp + '/' + credentials.AMAZON_REGION + '/' + credentials.AMAZON_SERVICE_NAME + '/' + 'aws4_request';
    var hashed_canonical_request = CryptoJS.SHA256(canonical_request).toString(CryptoJS.enc.Hex);
    var string_to_sign = algorithm + '\n' + amz_date + '\n' + credential_scope + '\n' + hashed_canonical_request;

    /************* TASK 3: CALCULATE THE SIGNATURE *************/

    var signing_key = _getSignatureKey();    
    var signature = CryptoJS.HmacSHA256(string_to_sign, signing_key).toString(CryptoJS.enc.Hex)
    var authorization_header = algorithm + ' ' + 'Credential=' + credentials.AMAZON_ACCESS_KEY + '/' + credential_scope + ', ' +  'SignedHeaders=' + signed_headers + ', ' + 'Signature=' + signature;

    /************* TASK 4: ADD SIGNING INFORMATION TO THE REQUEST *************/

    return {
      'Content-Type': content_type,
      'Accept': accept,
      'X-Amz-Date': amz_date,
      'X-Amz-Target': amz_target,
      'Authorization': authorization_header
    };
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

  root.createBitPayInvoice = function(data, cb) {
    var data = {
      price: data.price,
      currency: data.currency
    };
    $http(_postBitPay('/invoices', data)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR ' + data.data.error);
      return cb(data.data.error);
    });
  };

  root.getBitPayInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('BitPay Get Invoice: ERROR ' + data.data.error);
      return cb(data.data.error);
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

  root.createGiftCard = function(dataSrc, cb) {
    var sandbox = credentials.AMAZON_SANDBOX ? 'T' : 'P'; // T: test - P: production
    var now = moment().unix();
    var requestId = dataSrc.creationRequestId || credentials.AMAZON_PARTNER_ID + sandbox + now;
    
    var data = {
      'creationRequestId': requestId,
      'partnerId': credentials.AMAZON_PARTNER_ID,
      'value': {
        'currencyCode': dataSrc.currencyCode,
        'amount': dataSrc.amount
      }
    };

    var method = 'POST';
    var endpoint = '/CreateGiftCard';
    var amz_target = 'com.amazonaws.agcod.AGCODService.CreateGiftCard';

    var headers = _getHeaders(data, method, endpoint, amz_target);

    $http({
      'method': method,
      'url': credentials.AMAZON_ENDPOINT + endpoint, 
      'data': JSON.stringify(data), 
      'headers': headers
    }).then(function(data) {
      $log.info('Amazon.com Gift Card Create/Update: SUCCESS');
      var newData = data.data;
      newData['bitpayInvoiceId'] = dataSrc.bitpayInvoiceId;
      newData['bitpayInvoiceUrl'] = dataSrc.bitpayInvoiceUrl;
      newData['date'] = dataSrc.date || now;
      root.saveGiftCard(newData, null, function(err) {
        return cb(null, newData); 
      });
    }, function(data) {
      $log.error('Amazon.com Gift Card Create/Update: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.cancelGiftCard = function(dataSrc, cb) {
    var data = {
      'creationRequestId': dataSrc.creationRequestId,
      'partnerId': credentials.AMAZON_PARTNER_ID,
      'gcId': dataSrc.gcId,
    };

    var method = 'POST';
    var endpoint = '/CancelGiftCard';
    var amz_target = 'com.amazonaws.agcod.AGCODService.CancelGiftCard';

    var headers = _getHeaders(data, method, endpoint, amz_target);

    $http({
      'method': method,
      'url': credentials.AMAZON_ENDPOINT + endpoint, 
      'data': JSON.stringify(data), 
      'headers': headers
    }).then(function(data) {
      $log.info('Amazon.com Gift Card Cancel: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Amazon.com Gift Card Cancel: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  return root;

});
