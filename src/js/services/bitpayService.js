'use strict';

angular.module('copayApp.services').factory('bitpayService', function($log, $http, lodash, appIdentityService, bitauthService) {
  var root = {};

  var NETWORK = 'livenet';
//  var BITPAY_URL = NETWORK == 'livenet' ? 'https://bitpay.com' : 'https://test.bitpay.com';
  var BITPAY_URL = 'https://andy.bp:8088';
  var BITPAY_API_URL = BITPAY_URL + '/api/v2/';

  root.FACADE_PUBLIC = 'public';
  root.FACADE_USER = 'user';
  root.FACADE_VISA_USER = 'visaUser';
  root.FACADE_PAYROLL_USER = 'payrollUser';
  root.FACADE_PAYROLL_USER_RECORD = 'payrollUser/payrollRecord';

  root.getTokenForFacade = function(facade, tokens) {
    return lodash.find(tokens, function(t) {
      return t.facade == facade;
    });
  };

  root.getEnvironment = function() {
    return {
      network: NETWORK,
      apiUrl: BITPAY_API_URL,
      url: BITPAY_URL
    };
  };

  root.get = function(facade, endpoint, successCallback, errorCallback) {
    appIdentityService.getIdentity(root.getEnvironment().network, function(err, appIdentity) {
      if (err) {
        return errorCallback(err);
      }
      $http(_get(facade, endpoint, appIdentity)).then(function(data) {
        successCallback(data);
      }, function(data) {
        errorCallback(data);
      });
    });
  };

  root.post = function(facade, endpoint, json, successCallback, errorCallback) {
    appIdentityService.getIdentity(root.getEnvironment().network, function(err, appIdentity) {
      if (err) {
        return errorCallback(err);
      }
      $http(_post(facade, endpoint, json, appIdentity)).then(function(data) {
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
      $http(_postAuth('', json, appIdentity)).then(function(data) {
        data.appIdentity = appIdentity;
        successCallback(data);
      }, function(data) {
        errorCallback(data);
      });
    });
  };

  var _get = function(facade, endpoint, json, appIdentity) {
    switch (facade) {
      case root.FACADE_PUBLIC:
        return _getNoSignature(endpoint, json);
        break;

      default:
        return _getWithSignature(endpoint, json, appIdentity);
        break;
    }
  };

  var _getNoSignature = function(endpoint) {
    var ret = {
      method: 'GET',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };

    $log.debug('get:' + JSON.stringify(ret));
    return ret;
  };

  var _getWithSignature = function(endpoint, appIdentity) {
    var dataToSign = BITPAY_API_URL + endpoint;
    var signedData = bitauthService.sign(dataToSign, appIdentity.priv);

    var ret = {
      method: 'GET',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json',
        'x-identity': appIdentity.pub,
        'x-signature': signedData
      }
    };

    $log.debug('get:' + JSON.stringify(ret));
    return ret;
  };

  var _post = function(facade, endpoint, json, appIdentity) {
    switch (facade) {
      case root.FACADE_PUBLIC:
        return _postNoSignature(endpoint, json);
        break;

      default:
        return _postWithSignature(endpoint, json, appIdentity);
        break;
    }
  };

  var _postNoSignature = function(endpoint, json) {
    var ret = {
      method: 'POST',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: json
    };

    $log.debug('post:' + JSON.stringify(ret));
    return ret;
  };

  var _postWithSignature = function(endpoint, json, appIdentity) {
    var dataToSign = BITPAY_API_URL + endpoint + JSON.stringify(json);
    var signedData = bitauthService.sign(dataToSign, appIdentity.priv);

    var ret = {
      method: 'POST',
      url: BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json',
        'x-identity': appIdentity.pub,
        'x-signature': signedData
      },
      data: json
    };

    $log.debug('post:' + JSON.stringify(ret));
    return ret;
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
