'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, isCordova) {
  var root = {};
  var credentials = {};

  root.setCredentials = function(network) {
    credentials.SCOPE = ''
      + 'wallet:accounts:read,'
      + 'wallet:user:read,'
      + 'wallet:user:email,'
      + 'wallet:buys:read,'
      + 'wallet:buys:create,'
      + 'wallet:sells:read,'
      + 'wallet:sells:create,'
      + 'wallet:transactions:read';

    if (isCordova) {
      credentials.REDIRECT_URI = 'bitcoin://coinbase';
    } else {
      credentials.REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
    }

    if (network == 'testnet') {
      credentials.HOST = 'https://sandbox.coinbase.com';
      credentials.API = 'https://api.sandbox.coinbase.com';
      credentials.CLIENT_ID = '6cdcc82d5d46654c46880e93ab3d2a43c639776347dd88022904bd78cd067841';
      credentials.CLIENT_SECRET = '228cb6308951f4b6f41ba010c7d7981b2721a493c40c50fd2425132dcaccce59';
    }
    else {
      credentials.HOST = 'https://coinbase.com';
      credentials.API = 'https://api.coinbase.com';
      credentials.CLIENT_ID = '';
      credentials.CLIENT_SECRET = '';
    };
  };

  root.getOauthCodeUrl = function() {
    return credentials.HOST 
      + '/oauth/authorize?response_type=code&client_id=' 
      + credentials.CLIENT_ID 
      + '&redirect_uri='
      + credentials.REDIRECT_URI
      + '&state=SECURE_RANDOM&scope='
      + credentials.SCOPE;
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'authorization_code',
        code: code,
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Authorization Access Token: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Authorization Access Token: ERROR ' + data.statusText);
      return cb('Coinbase Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccounts = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts', token)).then(function(data) {
      $log.info('Coinbase Get Account: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Account: ERROR ' + data.statusText);
      return cb('Coinbase Get Account: ERROR ' + data.statusText);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase Autorization Information: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Autorization Information: ERROR ' + data.statusText);
      return cb('Coinbase Autorization Information: ERROR ' + data.statusText);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase Get Current User: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Current User: ERROR ' + data.statusText);
      return cb('Coinbase Get Current User: ERROR ' + data.statusText);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transactions: ERROR ' + data.statusText);
      return cb('Coinbase Transactions: ERROR ' + data.statusText);
    });
  };

  root.getEmail = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/email', token)).then(function(data) {
      $log.info('Coinbase Get Email: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Email: ERROR ' + data.statusText);
      return cb('Coinbase Get Email: ERROR ' + data.statusText);
    });
  };

  root.getPersonalInfo = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/personalinfo', token)).then(function(data) {
      $log.info('Coinbase Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Personal Info: ERROR ' + data.statusText);
      return cb('Coinbase Get Personal Info: ERROR ' + data.statusText);
    });
  };

  root.getStatus = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/status', token)).then(function(data) {
      $log.info('Coinbase User Status: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase User Status: ERROR ' + data.statusText);
      return cb('Coinbase User Status: ERROR ' + data.statusText);
    });
  };

  root.getLimits = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/limits', token)).then(function(data) {
      $log.info('Coinbase Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction Limits: ERROR ' + data.statusText);
      return cb('Coinbase Transaction Limits: ERROR ' + data.statusText);
    });
  }; 

  root.getTransaction = function(token, txid, cb) {
    if (!token) return cb('Invalid Token');
    if (!txid) return cb('TxId required');
    $http(_get('/transaction/' + txid, token)).then(function(data) {
      $log.info('Coinbase Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction: ERROR ' + data.statusText);
      return cb('Coinbase Transaction: ERROR ' + data.statusText);
    });
  };

  root.getSellAddress = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/create_sell_address', token)).then(function(data) {
      $log.info('Coinbase Create Sell Address: SUCCESS');
      return cb(null, data.data.sellAddress);
    }, function(data) {
      $log.error('Coinbase Create Sell Address: ERROR ' + data.statusText);
      return cb('Coinbase Create Sell Address: ERROR ' + data.statusText);
    });
  };

  root.get2faCode = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/authentication/get2faCode', token)).then(function(data) {
      $log.info('Coinbase Sent 2FA code by SMS: SUCCESS');
      return cb(null, data.status == 200 ? true : false);
    }, function(data) {
      $log.error('Coinbase Sent 2FA code by SMS: ERROR ' + data.statusText);
      return cb('Coinbase Sent 2FA code by SMS: ERROR ' + data.statusText);
    });
  };

  var _post = function(endpoint, token, twoFaCode, data) {
    return {
      method: 'POST',
      url: credentials.API + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
        '2FA_CODE': twoFaCode
      },
      data: data
    };
  };

  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, null, data)).then(function(data) {
      $log.info('Coinbase Sell Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Price: ERROR ' + data.statusText);
      return cb('Coinbase Sell Price: ERROR ' + data.statusText);
    });
  }; 

  root.sell = function(token, twoFaCode, data, cb) {
    var data = {
      refundAddress: data.refundAddress,
      signedTransaction: data.signedTransaction,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/sell', token, twoFaCode, data)).then(function(data) {
      $log.info('Coinbase Sell: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Request: ERROR ' + data.statusText);
      return cb('Coinbase Sell Request: ERROR ' + data.statusText);
    });
  };

  root.buyPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/buy', token, null, data)).then(function(data) {
      $log.info('Coinbase Buy Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Price: ERROR ' + data.statusText);
      return cb('Coinbase Buy Price: ERROR ' + data.statusText);
    });
  };

  root.buy = function(token, twoFaCode, data, cb) {
    var data = {
      destinationAddress: data.destinationAddress,
      qty: data.qty,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/buy', token, twoFaCode, data)).then(function(data) {
      $log.info('Coinbase Buy: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Request: ERROR ' + data.statusText);
      return cb('Coinbase Buy Request: ERROR ' + data.statusText);
    });
  };

  return root;

});
