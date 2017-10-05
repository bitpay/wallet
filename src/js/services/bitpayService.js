'use strict';

angular.module('copayApp.services').factory('bitpayService', function($log, $http, appIdentityService, bitauthService) {
  var root = {};

  var NETWORK = 'livenet';
  var BITPAY_API_URL = NETWORK == 'livenet' ? 'https://bitpay.com' : 'https://test.bitpay.com';

  root.getEnvironment = function() {
    return {
      network: NETWORK
    };
  };

  root.get = function(endpoint, successCallback, errorCallback) {
    $http(_get(endpoint)).then(function(data) {
      successCallback(data);
    }, function(data) {
      errorCallback(data);
    });
  };

  root.post = function(endpoint, json, successCallback, errorCallback) {
    appIdentityService.getIdentity(root.getEnvironment().network, function(err, appIdentity) {
      if (err) {
        return errorCallback(err);
      }
      $http(_post(endpoint, json, appIdentity)).then(function(data) {
        successCallback(data);
      }, function(data) {
        errorCallback(data);
      });
    });
  };

  root.postAuth = function(json, successCallback, errorCallback) {
    appIdentityService.getIdentity(root.getEnvironment().network, function(err, appIdentity) {
      if (err) {
        return errorCallback(err);
      }
      $http(_postAuth('/api/v2/', json, appIdentity)).then(function(data) {
        data.appIdentity = appIdentity;
        successCallback(data);
      }, function(data) {
        errorCallback(data);
      });
    });
  };

  var _get = function(endpoint) {
    return {
      method: 'GET',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _post = function(endpoint, json, appIdentity) {
    var dataToSign = BITPAY_API_URL + endpoint + JSON.stringify(json);
    var signedData = bitauthService.sign(dataToSign, appIdentity.priv);

    return {
      method: 'POST',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json',
        'x-identity': appIdentity.pub,
        'x-signature': signedData
      },
      data: json
    };
  };

  var _postAuth = function(endpoint, json, appIdentity) {
    json['params'].signature = bitauthService.sign(JSON.stringify(json.params), appIdentity.priv);
    json['params'].pubkey = appIdentity.pub;
    json['params'] = JSON.stringify(json.params);

    var ret = {
      method: 'POST',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: json
    };

    $log.debug('post auth:' + JSON.stringify(ret));
    return ret;
  };

  return root;
  
});
