'use strict';

angular.module('copayApp.services').factory('bitpayService', function($log, $http, platformInfo, appIdentityService, bitauthService, storageService, gettextCatalog, popupService, ongoingProcess) {
  var root = {};

  var NETWORK = 'livenet';
  var BITPAY_API_URL = NETWORK == 'livenet' ? 'https://bitpay.com' : 'https://test.bitpay.com';

  root.getEnvironment = function() {
    return {
      network: NETWORK
    };
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
   * }
   * 
   * pairingReason - text string to be embedded into popup message.  If `null` then the reason
   * message is not shown to the UI.
   *   "To {{reason}} you must pair this app with your BitPay account ({{email}})."
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
   *     token: api token for use in future calls
   *     pairData: the input pair data
   *     appIdentity: the identity of this app
   *   }
   */
  root.pair = function(pairData, pairingReason, cb) {
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
	    appIdentityService.getIdentity(root.getEnvironment().network, function(err, appIdentity) {
	      if (err) return cb(err);
        ongoingProcess.set('fetchingBitPayAccount', true);
	      $http(_postAuth('/api/v2/', json, appIdentity)).then(function(data) {
          ongoingProcess.set('fetchingBitPayAccount', false);

	        if (data && data.data.error) return cb(data.data.error);
	        $log.info('BitPay service BitAuth create token: SUCCESS');
	        var title = gettextCatalog.getString('Link BitPay Account?');
	        var msgDetail = 'Link BitPay account ({{email}})?';
	        if (pairingReason) {
		        msgDetail = 'To add your {{reason}} please link your BitPay account {{email}}';
		      }
	        var msg = gettextCatalog.getString(msgDetail, {
	        	reason: pairingReason,
	          email: pairData.email
	        });
	        var ok = gettextCatalog.getString('Confirm');
	        var cancel = gettextCatalog.getString('Cancel');
	        popupService.showConfirm(title, msg, ok, cancel, function(res) {
	        	if (res) {
			        var acctData = {
                token: data.data.data,
                email: pairData.email
              };
							setBitpayAccount(acctData, function(err) {
					      if (err) return cb(err);
				        return cb(null, true, {
				        	token: acctData.token,
				        	pairData: pairData,
				        	appIdentity: appIdentity
				        });
							});
	        	} else {
					    $log.info('User cancelled BitPay pairing process');
			        return cb(null, false);
	        	}
	        });
	      }, function(data) {
	        return cb(_setError('BitPay service BitAuth create token: ERROR ', data));
	      });
	    });
	  });
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
      if (err) return errorCallback(err);
      $http(_post(endpoint, json, appIdentity)).then(function(data) {
        successCallback(data);
      }, function(data) {
        errorCallback(data);
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

  var setBitpayAccount = function(accountData, cb) {
    storageService.setBitpayAccount(root.getEnvironment().network, accountData, cb);
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

  var _setError = function(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  return root;
  
});
