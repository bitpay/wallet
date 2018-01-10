'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, $window, $filter, platformInfo, lodash, storageService, configService, appConfigService, txFormatService, buyAndSellService, $rootScope, feeService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;
  var isNW = platformInfo.isNW;
  var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

  root.priceSensitivity = [{
    value: 0.5,
    name: '0.5%'
  }, {
    value: 1,
    name: '1%'
  }, {
    value: 2,
    name: '2%'
  }, {
    value: 5,
    name: '5%'
  }, {
    value: 10,
    name: '10%'
  }];

  root.selectedPriceSensitivity = root.priceSensitivity[1];

  var setCredentials = function() {

    if (!$window.externalServices || !$window.externalServices.coinbase) {
      return;
    }

    var coinbase = $window.externalServices.coinbase;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';

    // Coinbase permissions
    credentials.SCOPE = '' +
      'wallet:accounts:read,' +
      'wallet:addresses:read,' +
      'wallet:addresses:create,' +
      'wallet:user:read,' +
      'wallet:user:email,' +
      'wallet:buys:read,' +
      'wallet:buys:create,' +
      'wallet:sells:read,' +
      'wallet:sells:create,' +
      'wallet:transactions:read,' +
      'wallet:transactions:send,' +
      'wallet:transactions:send:bypass-2fa,' +
      'wallet:payment-methods:read';

    // NW has a bug with Window Object
    if (isCordova) {
      credentials.REDIRECT_URI = coinbase.redirect_uri.mobile;
    } else {
      credentials.REDIRECT_URI = coinbase.redirect_uri.desktop;
    }

    if (credentials.NETWORK == 'testnet') {
      credentials.HOST = coinbase.sandbox.host;
      credentials.API = coinbase.sandbox.api;
      credentials.CLIENT_ID = coinbase.sandbox.client_id;
      credentials.CLIENT_SECRET = coinbase.sandbox.client_secret;
    } else {
      credentials.HOST = coinbase.production.host;
      credentials.API = coinbase.production.api;
      credentials.CLIENT_ID = coinbase.production.client_id;
      credentials.CLIENT_SECRET = coinbase.production.client_secret;
    };

    // Force to use specific version
    credentials.API_VERSION = '2017-10-31';
  };

  var _afterTokenReceived = function(data, cb) {
    if (data && data.access_token && data.refresh_token) {
      storageService.setCoinbaseToken(credentials.NETWORK, data.access_token, function() {
        storageService.setCoinbaseRefreshToken(credentials.NETWORK, data.refresh_token, function() {
          buyAndSellService.updateLink('coinbase', true);
          return cb(null, data.access_token);
        });
      });
    } else {
      return cb('Could not get the access token');
    }
  };

  root.getErrorsAsString = function(data) {
    var errData;
    try {
      if (data && data.errors) errData = data.errors;
      else if (data && data.error) errData = data.error_description;
      else return 'Unknown error';

      if (!lodash.isArray(errData)) {
        errData = errData && errData.message ? errData.message : errData;
        return errData;
      }

      if (lodash.isArray(errData)) {
        var errStr = '';
        for (var i = 0; i < errData.length; i++) {
          errStr = errStr + errData[i].message + '. ';
        }
        return errStr;
      }

      return JSON.stringify(errData);
    } catch(e) {
      $log.error(e);
    };
  };

  root.getNetwork = function() {
    return credentials.NETWORK;
  };

  root.getStoredToken = function(cb) {
    storageService.getCoinbaseToken(credentials.NETWORK, function(err, accessToken) {
      if (err || !accessToken) return cb();
      return cb(accessToken);
    });
  };

  root.getAvailableCurrency = function() {
    var config = configService.getSync().wallet.settings;
    // ONLY "USD"
    switch (config.alternativeIsoCode) {
      default: return 'USD'
    };
  };

  root.checkEnoughFundsForFee = function(amount, cb) {
    _getNetAmount(amount, function(err, reducedAmount) {
      if (err) return cb(err);

      // Check if transaction has enough funds to transfer bitcoin from Coinbase to Copay
      if (reducedAmount < 0) {
        return cb('Not enough funds for fee');
      }

      return cb();
    });
  };

  root.getSignupUrl = function() {
    return credentials.HOST + '/signup';
  }

  root.getSupportUrl = function() {
    return 'https://support.coinbase.com/';
  }

  root.getOauthCodeUrl = function() {
    return credentials.HOST +
      '/oauth/authorize?response_type=code&client_id=' +
      credentials.CLIENT_ID +
      '&redirect_uri=' +
      credentials.REDIRECT_URI +
      '&state=SECURE_RANDOM&scope=' +
      credentials.SCOPE +
      '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'authorization_code',
        code: code,
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase: GET Access Token SUCCESS');
      // Show pending task from the UI
      _afterTokenReceived(data.data, cb);
    }, function(data) {
      $log.error('Coinbase: GET Access Token ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  var _getNetAmount = function(amount, cb) {
    // Fee Normal for a single transaction (450 bytes)
    var txNormalFeeKB = 450 / 1000;
    feeService.getFeeRate('btc', 'livenet', 'normal', function(err, feePerKb) {
      if (err) return cb('Could not get fee rate');
      var feeBTC = (feePerKb * txNormalFeeKB / 100000000).toFixed(8);

      return cb(null, amount - feeBTC, feeBTC);
    });
  };

  var _refreshToken = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'refresh_token',
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI,
        refresh_token: refreshToken
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase: Refresh Access Token SUCCESS');
      _afterTokenReceived(data.data, cb);
    }, function(data) {
      $log.error('Coinbase: Refresh Access Token ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  var _getMainAccountId = function(accessToken, cb) {
    root.getAccounts(accessToken, function(err, a) {
      if (err) return cb(err);
      var data = a.data;
      for (var i = 0; i < data.length; i++) {
        if (data[i].primary && data[i].type == 'wallet' && data[i].currency && data[i].currency.code == 'BTC') {
          return cb(null, data[i].id);
        }
      }
      root.logout(function() {});
      return cb('Your primary account should be a BTC WALLET. Set your wallet account as primary and try again');
    });
  };

  root.isActive = function(cb) {

    if (isWindowsPhoneApp)
      return cb();

    if (lodash.isEmpty(credentials.CLIENT_ID))
      return cb();

    storageService.getCoinbaseToken(credentials.NETWORK, function(err, accessToken) {
      return cb(err, !!accessToken);
    });
  }

  root.init = lodash.throttle(function(cb) {
    if (lodash.isEmpty(credentials.CLIENT_ID)) {
      return cb('Coinbase is Disabled. Missing credentials.');
    }
    $log.debug('Trying to initialise Coinbase...');

    storageService.getCoinbaseToken(credentials.NETWORK, function(err, accessToken) {
      if (err || !accessToken) return cb();
      else {
        _getMainAccountId(accessToken, function(err, accountId) {
          if (err) {
            if (!err.errors) return cb(err);

            if (err.errors && !lodash.isArray(err.errors)) return cb(err);

            var expiredToken;
            for (var i = 0; i < err.errors.length; i++) {
              if (err.errors[i].id == 'expired_token') expiredToken = true;
            }
            if (expiredToken) {
              $log.debug('Refresh token');
              storageService.getCoinbaseRefreshToken(credentials.NETWORK, function(err, refreshToken) {
                if (err) return cb(err);
                _refreshToken(refreshToken, function(err, newToken) {
                  if (err) return cb(err);
                  _getMainAccountId(newToken, function(err, accountId) {
                    if (err) return cb(err);
                    return cb(null, {
                      accessToken: newToken,
                      accountId: accountId
                    });
                  });
                });
              });
            } else {
              return cb(err);
            }
          } else {
            return cb(null, {
              accessToken: accessToken,
              accountId: accountId
            });
          }
        });
      }
    });
  }, 10000);

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'CB-VERSION': credentials.API_VERSION,
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccounts = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts', token)).then(function(data) {
      $log.info('Coinbase: Get Accounts SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Get Accounts ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getAccount = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId, token)).then(function(data) {
      $log.info('Coinbase: Get Account SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Get Account ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase: Autorization Information SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Authorization Information ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase: Get Current User SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Get Current User ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getBuyOrder = function(token, accountId, buyId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/buys/' + buyId, token)).then(function(data) {
      $log.info('Coinbase: Buy Info SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Buy Info ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getTransaction = function(token, accountId, transactionId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions/' + transactionId, token)).then(function(data) {
      $log.info('Coinbase: Transaction SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Transaction ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getAddressTransactions = function(token, accountId, addressId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/addresses/' + addressId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase: Address Transactions SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Address Transactions ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase: Transactions SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Transactions ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.paginationTransactions = function(token, Url, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get(Url.replace('/v2', ''), token)).then(function(data) {
      $log.info('Coinbase: Pagination Transactions SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Pagination Transactions ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.sellPrice = function(token, currency, cb) {
    $http(_get('/prices/sell?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase: Sell Price SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Sell Price ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.buyPrice = function(token, currency, cb) {
    $http(_get('/prices/buy?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase: Buy Price SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Buy Price ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getPaymentMethods = function(token, cb) {
    $http(_get('/payment-methods', token)).then(function(data) {
      $log.info('Coinbase: Get Payment Methods SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Get Payment Methods ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.getPaymentMethod = function(token, paymentMethodId, cb) {
    $http(_get('/payment-methods/' + paymentMethodId, token)).then(function(data) {
      $log.info('Coinbase: Get Payment Method SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Get Payment Method ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
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
        'CB-VERSION': credentials.API_VERSION,
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  };

  root.sellRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method ||  null,
      commit: data.commit || false,
      quote: data.quote || false
    };
    $http(_post('/accounts/' + accountId + '/sells', token, data)).then(function(data) {
      $log.info('Coinbase: Sell Request SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Sell Request ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.sellCommit = function(token, accountId, sellId, cb) {
    $http(_post('/accounts/' + accountId + '/sells/' + sellId + '/commit', token)).then(function(data) {
      $log.info('Coinbase: Sell Commit SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Sell Commit ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.buyRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: data.commit || false,
      quote: data.quote || false
    };
    $http(_post('/accounts/' + accountId + '/buys', token, data)).then(function(data) {
      $log.info('Coinbase: Buy Request SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Buy Request ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.buyCommit = function(token, accountId, buyId, cb) {
    $http(_post('/accounts/' + accountId + '/buys/' + buyId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Buy Commit: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Buy Commit ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  root.createAddress = function(token, accountId, data, cb) {
    var data = {
      name: data.name
    };
    $http(_post('/accounts/' + accountId + '/addresses', token, data)).then(function(data) {
      $log.info('Coinbase: Create Address SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Create Address ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
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
      $log.info('Coinbase: Send Transaction SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase: Send Transaction ERROR ' + data.status + '. ' + root.getErrorsAsString(data.data));
      return cb(data.data);
    });
  };

  // Pending transactions

  root.savePendingTransaction = function(ctx, opts, cb) {
    _savePendingTransaction(ctx, opts, cb);
  };

  var _savePendingTransaction = function(ctx, opts, cb) {
    storageService.getCoinbaseTxs(credentials.NETWORK, function(err, oldTxs) {
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

      storageService.setCoinbaseTxs(credentials.NETWORK, tx, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingTransactions = function(coinbasePendingTransactions) {
    storageService.getCoinbaseTxs(credentials.NETWORK, function(err, txs) {
      txs = txs ? JSON.parse(txs) : {};
      coinbasePendingTransactions.data = lodash.isEmpty(txs) ? null : txs;

      root.init(function(err, data) {
        if (err || lodash.isEmpty(data)) {
          if (err) $log.error(err);
          return;
        }
        var accessToken = data.accessToken;
        var accountId = data.accountId;

        lodash.forEach(coinbasePendingTransactions.data, function(dataFromStorage, txId) {
          if ((dataFromStorage.type == 'sell' && dataFromStorage.status == 'completed') ||
            (dataFromStorage.type == 'buy' && dataFromStorage.status == 'completed') ||
            dataFromStorage.status == 'error' ||
            (dataFromStorage.type == 'send' && dataFromStorage.status == 'completed'))
            return;
          root.getTransaction(accessToken, accountId, txId, function(err, tx) {
            if (err || lodash.isEmpty(tx) || (tx.data && tx.data.error)) {
              _savePendingTransaction(dataFromStorage, {
                status: 'error',
                error: (tx.data && tx.data.error) ? tx.data.error : err
              }, function(err) {
                if (err) $log.debug(err);
                _updateTxs(coinbasePendingTransactions);
              });
              return;
            }
            _updateCoinbasePendingTransactions(dataFromStorage, tx.data);
            coinbasePendingTransactions.data[txId] = dataFromStorage;
            if (tx.data.type == 'send' && tx.data.status == 'completed' && tx.data.from) {
              root.sellPrice(accessToken, dataFromStorage.sell_price_currency, function(err, s) {
                if (err) {
                  _savePendingTransaction(dataFromStorage, {
                    status: 'error',
                    error: err
                  }, function(err) {
                    if (err) $log.debug(err);
                    _updateTxs(coinbasePendingTransactions);
                  });
                  return;
                }
                var newSellPrice = s.data.amount;
                var variance = Math.abs((newSellPrice - dataFromStorage.sell_price_amount) / dataFromStorage.sell_price_amount * 100);
                if (variance < dataFromStorage.price_sensitivity.value) {
                  _sellPending(dataFromStorage, accessToken, accountId, coinbasePendingTransactions);
                } else {
                  _savePendingTransaction(dataFromStorage, {
                    status: 'error',
                    error: {errors: [{message: 'Price falls over the selected percentage'}]}
                  }, function(err) {
                    if (err) $log.debug(err);
                    _updateTxs(coinbasePendingTransactions);
                  });
                }
              });
            } else if (tx.data.type == 'buy' && tx.data.status == 'completed' && tx.data.buy) {
              _sendToWallet(dataFromStorage, accessToken, accountId, coinbasePendingTransactions);
            } else {
              _savePendingTransaction(dataFromStorage, {}, function(err) {
                if (err) $log.debug(err);
                _updateTxs(coinbasePendingTransactions);
              });
            }
          });
        });
      });
    });
  };

  root.updatePendingTransactions = lodash.throttle(function() {
    $log.debug('Updating coinbase pending transactions...');
    var pendingTransactions = {
      data: {}
    };
    root.getPendingTransactions(pendingTransactions);
  }, 20000);

  var _updateTxs = function(coinbasePendingTransactions) {
    storageService.getCoinbaseTxs(credentials.NETWORK, function(err, txs) {
      txs = txs ? JSON.parse(txs) : {};
      coinbasePendingTransactions.data = lodash.isEmpty(txs) ? null : txs;
    });
  };

  var _sellPending = function(tx, accessToken, accountId, coinbasePendingTransactions) {
    var data = tx.amount;
    data['payment_method'] = tx.payment_method || null;
    data['commit'] = true;
    root.sellRequest(accessToken, accountId, data, function(err, res) {
      if (err) {
        _savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
          _updateTxs(coinbasePendingTransactions);
        });
      } else {
        if (res.data && !res.data.transaction) {
          _savePendingTransaction(tx, {
            status: 'error',
            error: {errors: [{message: 'Sell order: transaction not found.'}]}
          }, function(err) {
            if (err) $log.debug(err);
            _updateTxs(coinbasePendingTransactions);
          });
          return;
        }

        root.getTransaction(accessToken, accountId, res.data.transaction.id, function(err, updatedTx) {
          if (err) {
            _savePendingTransaction(tx, {
              status: 'error',
              error: err
            }, function(err) {
              if (err) $log.error(err);
              _updateTxs(coinbasePendingTransactions);
            });
            return;
          }
          _savePendingTransaction(tx, {
            remove: true
          }, function(err) {
            _savePendingTransaction(updatedTx.data, {}, function(err) {
              if (err) $log.debug(err);
              _updateTxs(coinbasePendingTransactions);
            });
          });
        });
      }
    });
  };

  var _sendToWallet = function(tx, accessToken, accountId, coinbasePendingTransactions) {
    if (!tx) return;
    var desc = appConfigService.nameCase + ' Wallet';
    _getNetAmount(tx.amount.amount, function(err, amountBTC, feeBTC) {
      if (err) {
        _savePendingTransaction(tx, {
          status: 'error',
          error: {errors: [{message: err}]}
        }, function(err) {
          if (err) $log.debug(err);
          _updateTxs(coinbasePendingTransactions);
        });
        return;
      }

      var data = {
        to: tx.toAddr,
        amount: amountBTC,
        currency: tx.amount.currency,
        description: desc,
        fee: feeBTC
      };
      root.sendTo(accessToken, accountId, data, function(err, res) {
        if (err) {
          _savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
            _updateTxs(coinbasePendingTransactions);
          });
        } else {
          if (res.data && !res.data.id) {
            _savePendingTransaction(tx, {
              status: 'error',
              error: {errors: [{message: 'Transactions not found in Coinbase.com'}]}
            }, function(err) {
              if (err) $log.debug(err);
              _updateTxs(coinbasePendingTransactions);
            });
            return;
          }
          root.getTransaction(accessToken, accountId, res.data.id, function(err, sendTx) {
            if (err) {
              _savePendingTransaction(tx, {
                status: 'error',
                error: err
              }, function(err) {
                if (err) $log.error(err);
                _updateTxs(coinbasePendingTransactions);
              });
              return;
            }

            _savePendingTransaction(tx, {
              remove: true
            }, function(err) {
              if (err) $log.error(err);
              _savePendingTransaction(sendTx.data, {}, function(err) {
                if (err) $log.debug(err);
                _updateTxs(coinbasePendingTransactions);
              });
            });
          });
        }
      });
    });
  };

  var _updateCoinbasePendingTransactions = function(obj /*, …*/ ) {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        var val = arguments[i][prop];
        if (typeof val == "object")
          _updateCoinbasePendingTransactions(obj[prop], val);
        else
          obj[prop] = val ? val : obj[prop];
      }
    }
    return obj;
  };

  root.logout = function(cb) {
    storageService.removeCoinbaseToken(credentials.NETWORK, function() {
      buyAndSellService.updateLink('coinbase', false);
      storageService.removeCoinbaseRefreshToken(credentials.NETWORK, function() {
        storageService.removeCoinbaseTxs(credentials.NETWORK, function() {
          return cb();
        });
      });
    });
  };

  var register = function() {

    root.isActive(function(err, isActive) {
      if (err) return;

      buyAndSellService.register({
        name: 'coinbase',
        logo: 'img/coinbase-logo.png',
        location: '33 Countries',
        sref: 'tabs.buyandsell.coinbase',
        configSref: 'tabs.preferences.coinbase',
        linked: isActive,
      });
    });
  };

  setCredentials();
  register();

  $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
    if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') {
      root.isActive(function(err, isActive) {
        // Update Coinbase
        if (isActive)
          root.updatePendingTransactions();
      });
    }
  });
  return root;
});
