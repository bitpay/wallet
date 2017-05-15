'use strict';

angular.module('copayApp.services').factory('bitpayAccountService', function($log, lodash, platformInfo, appIdentityService, bitpayService, bitpayCardService, storageService, gettextCatalog, popupService, externalLinkService) {

  var root = {};

  var accountCache = [];

  // A list of facades that this service recognizes.
  //   items - the kind of items that this facade manages; UI friendly description.
  //   startUrl - url where pairing with this facade starts.
  var pairFor = {
    visaUser: {
      items: 'BitPay Visa<sup>&reg;</sup> card(s)',
      startUrl: 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm'
    },
    payrollUser: {
      items: 'payroll settings',
      startUrl: 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm' // TODO
    }
  };

  root.startPairBitPayAccount = function(facade) {
    if (!facade || !pairFor[facade]) {
      return $log.error('Start account pairing failed, unrecognized facade: ' + facade);
    }
    externalLinkService.open(pairFor[facade].startUrl);
    $log.info('Started account pairing process for ' + facade);
  };

  /*
   * Pair this app with the bitpay server using the specified pairing data.
   * An app identity will be created if one does not already exist.
   * Pairing data is provided by an input URI provided by the bitpay server.
   *
   * pairData - data needed to complete the pairing process
   * {
   *   secret: shared pairing secret
   *   email: email address associated with bitpay account
   *   otp: two-factor one-time use password
   *   facade: facade for whihch access is being requested
   * }
   * 
   * cb - callback after completion
   *   callback(err, paired, apiContext)
   *
   *   err - something unexpected happened which prevented the pairing
   * 
   *   paired - boolean indicating whether the pairing was compledted by the user
   * 
   *   apiContext - the context needed for making future api calls
   *   {
   *     tokens: api token array for use in future calls {token, facade}
   *     pairData: the input pair data
   *     appIdentity: the identity of this app
   *   }
   */
  root.pair = function(pairData, cb) {
    checkOtp(pairData, function(otp) {
      pairData.otp = otp;
	    var deviceName = 'Unknown device';
	    if (platformInfo.isNW) {
	      deviceName = require('os').platform();
	    } else if (platformInfo.isCordova) {
	      deviceName = device.model;
	    }
	    var json = {
	      method: 'createToken',
	      params: {
	        secret: pairData.secret,
	        version: 2,
	        deviceName: deviceName,
	        code: pairData.otp
	      }
	    };

      bitpayService.postAuth(json, function(data) {
        if (data && data.data.error) {
          return cb(data.data.error);
        }
        var apiContext = {
          tokens: [{
            token: data.data.data,
            facade: pairData.facade
          }],
          pairData: pairData,
          appIdentity: data.appIdentity
        };
        $log.info('BitPay service BitAuth create token: SUCCESS');

        fetchBasicInfo(apiContext, function(err, basicInfo) {
          if (err) {
            return cb(err);
          }
          var title = gettextCatalog.getString('Allow Access?');
          var msg = gettextCatalog.getString('Allow this device to access your {{items}} on your BitPay account ({{email}})?', {
          	items: pairFor[pairData.facade].items,
            email: pairData.email
          });
          var ok = gettextCatalog.getString('Allow');
          var cancel = gettextCatalog.getString('Deny');

          popupService.showConfirm(title, msg, ok, cancel, function(res) {
          	if (res) {
  		        var acctData = {
                token: apiContext.tokens[0].token,
                facade: apiContext.tokens[0].facade,
                email: pairData.email,
                givenName: basicInfo.givenName,
                familyName: basicInfo.familyName
              };
  						setAccount(acctData, function(err) {
  			        return cb(err, true, apiContext);
  						});
          	} else {
  				    $log.info('User cancelled BitPay pairing process');
  		        return cb(null, false);
          	}
          });
        });
      }, function(data) {
        return cb(_setError('BitPay service BitAuth create token: ERROR ', data));
	    });
	  });
  };

  var checkOtp = function(pairData, cb) {
    if (pairData.otp) {
      var msg = gettextCatalog.getString('Enter Two Factor for your BitPay account');
      popupService.showPrompt(null, msg, null, function(res) {
        cb(res);
      });
    } else {
      cb();
    }
  };

  var fetchBasicInfo = function(apiContext, cb) {
    // The 'getBasicInfo' method must be on all user facades we use. We don't check the apiContext.tokens
    // here, we just use the first token in the list.
    var json = {
      method: 'getBasicInfo'
    };
    // Get basic account information
    bitpayService.post(bitpayService.FACADE_USER, apiContext.tokens[0].token, json, function(data) {
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Get Basic Info: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Account Error: Get Basic Info', data));
    });
  };

  // Check if the given email address is already used on an account.
  root.checkAccountAvailable = function(email, cb) {
    var json = {
      method: 'checkAccountAvailable',
      params: JSON.stringify({
        email: email
      })
    };

    bitpayService.post(bitpayService.FACADE_PUBLIC, '', json, function(data) {
      if (data && data.data.error) return cb(data.data.error);
      $log.info('Check Account Available: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      return cb(_setError('BitPay Account Error: Check Account Available', data));
    });
  };

  // Returns account objects as stored.
  root.getAccountsAsStored = function(cb) {
    storageService.getBitpayAccounts(bitpayService.getEnvironment().network, cb);
  };

  // Returns an array where each element represents an account including all information required for fetching data
  // from the server for each account (apiContext).
  root.getAccounts = function(cb) {
    cb = cb || function(){};
    root.getAccountsAsStored(function(err, accounts) {
      if (err || lodash.isEmpty(accounts)) {
        return cb(err, []);
      }
      appIdentityService.getIdentity(bitpayService.getEnvironment().network, function(err, appIdentity) {
        if (err) {
          return cb(err);
        }

        // Reset cache.
        accountCache = [];

        lodash.forEach(Object.keys(accounts), function(key) {
          accounts[key].cards = accounts[key].cards;
          accounts[key].email = key;
          accounts[key].givenName = accounts[key].givenName || '';
          accounts[key].familyName = accounts[key].familyName || '';
          accounts[key].apiContext = {
            tokens: accounts[key].tokens,
            pairData: {
              email: key
            },
            appIdentity: appIdentity
          };

          accountCache.push(accounts[key]);
        });
        return cb(null, accountCache);
      });
    });
  };

  // Convenience function returns the specified account.
  root.getAccount = function(email, cb) {
    root.getAccounts(function(err, accounts) {
      if (err) {
        return cb(err);
      }
      var account = lodash.find(accounts, function(account) {
        return account.email == email;
      });
      // Can return undefined (not found).
      cb(null, account);
    });
  };

  root.getAccountSync = function(email) {
    return lodash.find(accountCache, function(account) {
      return account.email == email;
    });
  };

  var setAccount = function(account, cb) {
    storageService.setBitpayAccount(bitpayService.getEnvironment().network, account, function(err) {
      return cb(err);
    });
  };

  root.removeAccount = function(account, cb) {
    storageService.removeBitpayAccount(bitpayService.getEnvironment().network, account, function(err) {
      bitpayCardService.registerNextStep();
      cb(err);
    });
  };

  var _setError = function(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  // Initialize account cache.
  root.getAccounts();

  return root;
  
});
