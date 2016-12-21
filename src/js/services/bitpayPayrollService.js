'use strict';

angular.module('copayApp.services').factory('bitpayPayrollService', function($log, lodash, configService) {

  var root = {};

  root.startDeduction = function(deduction, cb) {
  	checkArgument(deduction.amount, 'deduction.amount');
  	checkArgument(deduction.currencyCode, 'deduction.currencyCode');
  	checkArgument(deduction.address, 'deduction.address');
  	checkArgument(deduction.walletId, 'deduction.walletId');

  	invalidateCache(function(err) {
      if (err) {
      	$log.error(err);
      	return cb(err);
      }
	  	deduction.unverifiedAddressAccepted = false;
	  	deduction.active = true;
			createDeduction(deduction, cb);
  	});
  };

  root.stopDeduction = function(cb) {
  	var deduction = {
	  	active: false
  	};
		root.updateDeduction(deduction, cb);
  };

  root.fetchDeduction = function(cb) {
  	invalidateCache(function(err) {
      if (err) {
      	$log.error(err);
      	return cb(err);
      }
		  getDeduction(function(err, deduction) {
	      if (err) {
	      	$log.error(err);
	      	return cb(err);
	      }
		  	cache(deduction, function(err, deduction) {
		      if (err) {
		      	$log.error(err);
		      	return cb(err);
		      }
		  		cb(null, deduction);
		  	});
		  });
	  });
	};

	root.fetchEffectiveDate = function(cb) {
	  getEffectiveDate(function(err, date) {
      if (err) {
      	$log.error(err);
      	return cb(err);
      }
  		cb(null, date);
	  });
	};

  root.deduction = function() {
    if (!configService.getSync().payroll.deductionCacheValid) {
      throw new Error('bitpayPayrollService#deduction called when cache is not initialized');
    }
		return configService.getSync().payroll.deductionCache;
	};

  root.updateDeduction = function(deductionChanges, cb) {
  	var newDeduction = lodash.merge(root.deduction(), deductionChanges);
  	postDeduction(newDeduction, function(err, deduction) {
      if (err) {
        $log.error(err);
        return cb(err);
      }
		  cache(deduction, function(err, deduction) {
	      if (err) {
	        $log.error(err);
			  	return cb(err);
	      }
		  	return cb(null, deduction);
		  });
  	});
  };

  function checkArgument(val, name) {
    if(val == undefined) {
      throw new Error('Missing argument: ' + name);
    }
  };

  function createDeduction(deduction, cb) {
  	postDeduction(deduction, function(err, deduction) {
      if (err) {
        $log.error(err);
        return cb(err);
      }
		  cache(deduction, function(err, deduction) {
	      if (err) {
	        $log.error(err);
			  	return cb(err);
	      }
		  	return cb(null, deduction);
		  });
  	});
  };

  function cache(deduction, cb) {
    var opts = {
      payroll: {
      	deductionCache: deduction
      }
    };
    configService.set(opts, function(err) {
      if (err) {
      	$log.error(err);
      	return cb(err);
      }
	    var opts = {
	      payroll: {
	      	deductionCacheValid: true
	      }
	    };
	    configService.set(opts, function(err) {
	      if (err || !configService.getSync().payroll.deductionCacheValid) {
	      	$log.error(err);
	      	return cb(err);
	      }
	      return cb(null, configService.getSync().payroll.deductionCache);
	    });
    });
  };

  function invalidateCache(cb) {
    var opts = {
      payroll: {
      	deductionCacheValid: false
      }
    };
    configService.set(opts, function(err) {
	      if (err || configService.getSync().payroll.deductionCacheValid) {
      	$log.error(err);
      	return cb(err);
      }
      return cb(null);
    });
  };

  function getDeduction(cb) {
    //
    // TODO: GET from bitpay server
    // 
    var deduction = {
    	active: true,
      address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
      amount: 10.50,
      currencyCode: 'USD',
      effectiveDate: new Date(),
//      walletId: '13f68a06-4299-4ed6-8fe6-323298759b16',
      walletId: '4b4e6038-7325-4a71-b500-a2e1c5d80d64',
      externalWalletName: 'Andy\'s Paper Wallet'
    };

    $log.debug('GET payroll deduction: ' + JSON.stringify(deduction));
    var err = null;
    return cb(err, deduction);
  };

  function getEffectiveDate(cb) {
    //
    // TODO: GET from bitpay server
    // 
    var date = new Date();

    $log.debug('GET payroll effective date: ' + JSON.stringify(date));
    var err = null;
    return cb(err, date);
  };

  function postDeduction(deduction, cb) {
    //
    // TODO: POST to bitpay server
    // 
    $log.debug('POST payroll deduction: ' + JSON.stringify(deduction));
    var err = null;
  	cb(err, deduction);
  };

  return root;

});
