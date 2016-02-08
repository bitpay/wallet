'use strict';
angular.module('copayApp.api').factory('copayWalletApi', function(FocusedWallet, configService, txFormatService) {

  var root = {};

	// Return the current wallet currency unit name.
	// 
	root.getWalletCurrencyName = function() {
	  return configService.getSync().wallet.settings.unitName;
	};

	// Return the current wallet currency code.
	// 
	root.getWalletCurrencyCode = function() {
	  return configService.getSync().wallet.settings.unitCode;
	};

	// Return the current wallet alternative currency unit name.
	// 
	root.getWalletAltCurrencyName = function() {
	  return configService.getSync().wallet.settings.alternativeName;
	};
	
	// Return the current wallet alternative currency unit ISO code.
	// 
	root.getWalletAltCurrencyIsoCode = function() {
	  return configService.getSync().wallet.settings.alternativeIsoCode;
	};
	
	// Return the current wallet conversion for unit to satoshi.
	// 
	root.getWalletUnitToSatoshi = function() {
	  return configService.getSync().wallet.settings.unitToSatoshi;
	};

	// Return the current wallet unit number of decimal places.
	// 
	root.getWalletUnitDecimals = function() {
	  return configService.getSync().wallet.settings.unitDecimals;
	};

	// Return the formatted amount for display using the current wallet settings.
	// 
  root.formatAmount = function(amount) {
  	return txFormatService.formatAmount(amount);
  };

  // Sends a bitcoin payment from the current wallet.
  // This method does not present any user interface confirmation or intervention.
  // It is recommended that the caller obtainm user confirmation prior to calling this method.
  // 
  // data: {
  //   // For payment-protocol payments provide the following.
  //   payProUrl:
  //   memo:
  //   // For all other payments provide the following.
  //   // These values must conform to PayPro.get() properties.
  //   toAddress:
  //   amount:
  //   memo:
  // }
  // 
  root.sendPayment = function(data, callback) {
    return FocusedWallet.sendPayment(data, callback);
  };

  return root;
});