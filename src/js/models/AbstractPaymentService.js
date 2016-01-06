'use strict';

angular.module('copayApp.model').factory('AbstractPaymentService', function ($rootScope, $log, $http, $timeout, FocusedWallet, isChromeApp, configService, lodash, gettext) {
 
  // Constructor
  // See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz
  // 
  function AbstractPaymentService() {
  };

  // Static methods
  // 
  // Convenience method to maintain interation with this service by the caller.
  AbstractPaymentService.sendPayment = function(data, cb) {
    return FocusedWallet.sendPayment(data, cb);
  };

  // Public methods
  // 
  AbstractPaymentService.prototype.guid = function() {
    return Date.now();
  };

  AbstractPaymentService.prototype.get = function(endpoint) {
    $log.debug('GET ' + encodeURI(this.provider.api.url + endpoint));
    var getData = {
      method: 'GET',
      url: encodeURI(this.provider.api.url + endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    $http(getData).then(function(response) {
      $log.info('GET SUCCESS: ' + endpoint);
      cb(null, response);
    }, function(error) {
      $log.error('GET ERROR: ' + endpoint + ', ' + error.statusText);
      cb(error.statusText, null);
    });
  };

  AbstractPaymentService.prototype.post = function(endpoint, data, cb) {
    $log.debug('POST ' + encodeURI(this.provider.api.url + endpoint) + ' data = ' + JSON.stringify(data));
    var postData = {
      method: 'POST',
      url: encodeURI(this.provider.api.url + endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    };
    $http(postData).then(function(response) {
      $log.info('POST SUCCESS: ' + endpoint);
      cb(null, response);
    }, function(error) {
      $log.error('POST ERROR: ' + endpoint + ', ' + error.statusText);
      cb(error.statusText, null);
    });
  };

  // Override with concrete implementation.
  // 
  AbstractPaymentService.prototype.createPaymentRequest = function(data, cb) {
    return cb('Error: AbstractPaymentService.prototype.createPaymentRequest() should be overridden by your implementation', null);
  };

  // Override with concrete implementation.
  // 
  AbstractPaymentService.prototype.sendPayment = function(data, cb) {
    return cb('Error: AbstractPaymentService.prototype.sendPayment() should be overridden by your implementation');
  };

  return AbstractPaymentService;
});
