'use strict';

angular.module('copayApp.plugins').controller('bitrefillController', function($rootScope, $scope, $log, $ionicSlideBoxDelegate, lodash, gettext, copayAppletApi, copayWalletApi) {

  var self = this;

  this.applet = copayAppletApi.getApplet();
  var bitrefillService = this.applet.getService('bitrefill-service');
  var paymentService = this.applet.getService('payment-service');

  this.phoneNumber = '1234567';
  this.operators = null;
  this.selectedOp = null;
  this.country = null;
  this.pkgs = null;
  this.pkg = null;
  this.amount = null;
  this.pageId = 0;

  var pages = [{
  	id: 0,
  	title: 'Top up mobile phone',
  	buttonNextText: 'CONTINUE',
  	buttonPreviousText: 'BACK'
  },
  {
  	id: 1,
  	title: 'Top up mobile phone',
  	buttonNextText: 'CONTINUE',
  	buttonPreviousText: 'BACK'
  },
  {
  	id: 2,
  	title: 'Top up mobile phone',
  	buttonNextText: 'PAY',
  	buttonPreviousText: 'BACK'
  }];

  function init() {
    copayAppletApi.setTitle("Top Up Mobile Phone");

  	// Disable swipe page sliding.
    $ionicSlideBoxDelegate.enableSlide(false);
  };

	this.nextPage = function() {
    console.log('nextPage: current page: '+ $ionicSlideBoxDelegate.currentIndex());
    $ionicSlideBoxDelegate.next();
	};

	this.previousPage = function() {
    console.log('prevPage: current page: '+ $ionicSlideBoxDelegate.currentIndex());
    $ionicSlideBoxDelegate.previous();
	};

	function getPage() {
		var page = lodash.find(pages, {
		  id: self.pageId
		});
  	return page;		
	};

  this.getPageTitle = function() {
  	return getPage().title;
  };

  this.getPageNextButtonText = function() {
  	return getPage().buttonNextText;
  };

  this.getPagePreviousButtonText = function() {
  	return getPage().buttonPreviousText;
  };

  this.setOngoingProcess = function(message) {
    $rootScope.$emit('Local/PluginStatus', message);
  };

	var handleError = function(err) {
    $log.error(err);
    self.setOngoingProcess();
//    $scope.error = err;
  };

  this.lookupNumber = function() {
//    $scope.error = $scope.btcValueStr = null;
    var operatorSlug = $scope.selectedOp ? $scope.selectedOp.slug : null;

    self.setOngoingProcess(gettext('Looking up operator'));

    bitrefillService.lookupNumber(self.phoneNumber, operatorSlug, function(err, result) {
	    self.setOngoingProcess();
      if (err) {
        return handleError(err.message || err.error.message || err);
      }
      $log.debug(result);
      self.operators = result.altOperators;
      self.country = result.country;
      if (result.operator) {
        self.operators.push(lodash.pick(result.operator, ['slug', 'name', 'logoImage']));
        self.selectedOp = result.operator;
        var pkgs = result.operator.packages;
        pkgs.forEach(function(pkg) {
          pkg.valueStr = pkg.value + ' ' + self.selectedOp.currency;
          pkg.btcValueStr = copayWalletApi.formatAmount(pkg.satoshiPrice) + ' ' + copayWalletApi.getWalletCurrencyName();
        });
        self.pkgs = pkgs;
        if (!result.operator.isRanged) {
          self.amount = null;
        } else {
          self.pkg = null;
        }
      }
    });
  };

  init();  
});
