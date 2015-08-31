'use strict';

angular.module('copayApp.services').factory('glideraService', function($http, $log) {
  var root = {};
  var HOST = 'https://sandbox.glidera.io';
  var REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
  var CLIENT_ID = '9915b6ffa6dc3baffb87135ed3873d49';
  var CLIENT_SECRET = 'd74eda05b9c6a228fd5c85cfbd0eb7eb';

  root.getOauthCodeUrl = function() {
    return HOST 
      + '/oauth2/auth?response_type=code&client_id=' 
      + CLIENT_ID 
      + '&redirect_uri='
      + REDIRECT_URI;
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: HOST + '/api/v1/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'authorization_code',
        code: code,
        client_id : CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Glidera Authorization Access Token: SUCCESS');
      return cb(null, data); 
    }, function(data) {
      $log.error('Glidera Authorization Access Token: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getPermissions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/oauth/token', token)).then(function(data) {
      $log.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Access Token Permissions: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getEmail = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/email', token)).then(function(data) {
      $log.info('Glidera Get Email: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Email: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getPersonalInfo = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/personalinfo', token)).then(function(data) {
      $log.info('Glidera Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Personal Info: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getStatus = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/status', token)).then(function(data) {
      $log.info('Glidera User Status: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera User Status: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getLimits = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/limits', token)).then(function(data) {
      $log.info('Glidera Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction Limits: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getTransactions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/transaction', token)).then(function(data) {
      $log.info('Glidera Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.getSellAddress = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/create_sell_address', token)).then(function(data) {
      $log.info('Glidera Create Sell Address: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Create Sell Address: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  };

  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, data)).then(function(data) {
      $log.info('Glidera Sell Price: SUCCESS');
      return cb(null, data); 
    }, function(data) {
      $log.error('Glidera Sell Price: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  }; 

  root.sell = function(token, data, cb) {
    var data = {
      refundAddress: data.refundAddress,
      signedTransaction: data.signedTransaction,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/prices/buy', token, data)).then(function(data) {
      $log.info('Glidera Buy: SUCCESS');
      return cb(null, data); 
    }, function(data) {
      $log.error('Glidera Buy: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.buyPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/buy', token, data)).then(function(data) {
      $log.info('Glidera Buy Price: SUCCESS');
      return cb(null, data); 
    }, function(data) {
      $log.error('Glidera Buy Price: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  root.buy = function(token, data, cb) {
    var data = {
      destinationAddress: data.destinationAddress,
      qty: data.qty,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/prices/buy', token, data)).then(function(data) {
      $log.info('Glidera Buy: SUCCESS');
      return cb(null, data); 
    }, function(data) {
      $log.error('Glidera Buy: ERROR ' + data.statusText);
      return cb(data.statusText);
    });
  };

  return root;

});
