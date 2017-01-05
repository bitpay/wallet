'use strict';

angular.module('copayApp.services').service('externalServicesList', function(configService, gettextCatalog) {

  var root = {};

  root.get = function() {
	  var config = configService.getSync();
	  var services = [
	    {
	    	name: gettextCatalog.getString('This app'),
	    	desc: gettextCatalog.getString('Manage your bitcoin wallets.'),
	    	hint: gettextCatalog.getString(''),
	    	support: {
		    	email: 'support@bitpay.com',
		    	phone: undefined,
		    	url: 'https://help.bitpay.com/'
	    	},
	    	enabled: true
	    },
	    {
	    	name: gettextCatalog.getString('Amazon'),
	    	desc: gettextCatalog.getString('Buy Amazon.com gift cards.'),
	    	hint: gettextCatalog.getString('buy gift card'),
	    	support: {
		    	email: undefined,
		    	phone: '1 (888) 280-4331',
		    	url: 'https://www.amazon.com/gp/help/customer/display.html'
	    	},
	    	enabled: config.amazon.enabled
	    },
	    {
	    	name: gettextCatalog.getString('BitPay Card'),
	    	desc: gettextCatalog.getString('Top-up Visa debit card.'),
	    	hint: gettextCatalog.getString('top-up debit card'),
	    	support: {
		    	email: 'cardservices@bitpay.com',
		    	phone: '1 (855) 884-7568',
		    	url: 'https://bitpay.com/card'
	    	},
	    	enabled: config.bitpayCard.enabled
	    },
	    {
	    	name: gettextCatalog.getString('Coinbase'),
	    	desc: gettextCatalog.getString('Buy & sell bitcoin.'),
	    	hint: gettextCatalog.getString('buy & sell bitcoin'),
	    	support: {
		    	email: 'support@coinbase.com',
		    	phone: undefined,
		    	url: 'https://support.coinbase.com'
	    	},
	    	enabled: config.coinbase.enabled
	    },
	    {
	    	name: gettextCatalog.getString('Glidera'),
	    	desc: gettextCatalog.getString('Buy & sell bitcoin.'),
	    	hint: gettextCatalog.getString('buy & sell bitcoin'),
	    	support: {
		    	email: 'support@glidera.io',
		    	phone: undefined,
		    	url: 'https://www.glidera.io'
	    	},
	    	enabled: config.glidera.enabled
	    }
	  ];
	  return services;
  };

  return root;
});
