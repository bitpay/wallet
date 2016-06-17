'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, platformInfo, lodash, storageService, configService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  root.setCredentials = function(network) {
    credentials.SCOPE = ''
      + 'wallet:accounts:read,'
      + 'wallet:addresses:read,'
      + 'wallet:addresses:create,'
      + 'wallet:user:read,'
      + 'wallet:user:email,'
      + 'wallet:buys:read,'
      + 'wallet:buys:create,'
      + 'wallet:sells:read,'
      + 'wallet:sells:create,'
      + 'wallet:transactions:read,'
      + 'wallet:transactions:send,'
      + 'wallet:payment-methods:read';

    if (isCordova) {
      credentials.REDIRECT_URI = 'copay://coinbase';
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
      credentials.CLIENT_ID = window.coinbase_client_id;
      credentials.CLIENT_SECRET = window.coinbase_client_secret;
    };
  };

  root.getOauthCodeUrl = function() {
    return credentials.HOST 
      + '/oauth/authorize?response_type=code&client_id=' 
      + credentials.CLIENT_ID 
      + '&redirect_uri='
      + credentials.REDIRECT_URI
      + '&state=SECURE_RANDOM&scope='
      + credentials.SCOPE
      + '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
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
      return cb(data.data);
    });
  };

  root.refreshToken = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'refresh_token',
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI,
        refresh_token: refreshToken 
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Refresh Access Token: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Refresh Access Token: ERROR ' + data.statusText);
      return cb(data.data);
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
      $log.info('Coinbase Get Accounts: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Accounts: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAccount = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId, token)).then(function(data) {
      $log.info('Coinbase Get Account: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Account: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase Autorization Information: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Autorization Information: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase Get Current User: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Current User: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransaction = function(token, accountId, transactionId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions/' + transactionId, token)).then(function(data) {
      $log.info('Coinbase Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.paginationTransactions = function(token, Url, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get(Url.replace('/v2', ''), token)).then(function(data) {
      $log.info('Coinbase Pagination Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Pagination Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellPrice = function(token, currency, cb) {
    $http(_get('/prices/sell?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Sell Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  }; 

  root.buyPrice = function(token, currency, cb) {
    $http(_get('/prices/buy?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Buy Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethods = function(token, cb) {
    $http(_get('/payment-methods', token)).then(function(data) {
      $log.info('Coinbase Get Payment Methods: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Get Payment Methods: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethod = function(token, paymentMethodId, cb) {
    $http(_get('/payment-methods/' + paymentMethodId, token)).then(function(data) {
      $log.info('Coinbase Get Payment Method: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Get Payment Method: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  }; 

  root.sellRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: data.commit || false
    };
    $http(_post('/accounts/' + accountId + '/sells', token, data)).then(function(data) {
      $log.info('Coinbase Sell Request: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellCommit = function(token, accountId, sellId, cb) {
    $http(_post('/accounts/' + accountId + '/sells/' + sellId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Sell Commit: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  }; 

  root.buyRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: false
    };
    $http(_post('/accounts/' + accountId + '/buys', token, data)).then(function(data) {
      $log.info('Coinbase Buy Request: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyCommit = function(token, accountId, buyId, cb) {
    $http(_post('/accounts/' + accountId + '/buys/' + buyId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Buy Commit: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.createAddress = function(token, accountId, data, cb) {
    var data = {
      name: data.name
    };
    $http(_post('/accounts/' + accountId + '/addresses', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sendTo = function(token, accountId, data, cb) {
    var data = {
      type: 'send',
      to: data.to,
      amount: data.amount,
      currency: data.currency,
      description: data.description
    };
    $http(_post('/accounts/' + accountId + '/transactions', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  // Pending transactions
  
  root.savePendingTransaction = function(ctx, opts, cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, oldTxs) {
      if (lodash.isString(oldTxs)) {
        oldTxs = JSON.parse(oldTxs);
      }
      if (lodash.isString(ctx)) {
        ctx = JSON.parse(ctx);
      }
      var tx = oldTxs || {};
      tx[ctx.id] = ctx;
      if (opts && (opts.error || opts.status)) {
        tx[ctx.id] = lodash.assign(tx[ctx.id], opts);
      }
      if (opts && opts.remove) {
        delete(tx[ctx.id]);
      }
      tx = JSON.stringify(tx);

      storageService.setCoinbaseTxs(network, tx, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingTransactions = function(cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, txs) {
      var _txs = txs ? JSON.parse(txs) : {};
      return cb(err, _txs);
    });
  };

  root.logout = function(network, cb) {
    storageService.removeCoinbaseToken(network, function() {
      storageService.removeCoinbaseRefreshToken(network, function() {
        return cb();
      });
    });
  };

  return root;

});
