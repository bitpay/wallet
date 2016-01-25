'use strict';

angular.module('copayApp.plugins').factory('BitrefillService', function ($log, $base64, $http, copayPluginService) {

  // Service identification
  // 
  var id = 'bitrefill';

  // Private properties
  //
  var self = null;
 
  // Constructor
  // 
  function BitrefillService(obj) {
    self = this;
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        self[property] = obj[property];
      }
    }
    var my = copayPluginService.getRegistryEntry(id);
    self.providerName = my.name;
    self.providerDescription = my.description;
  };

  // Public methods
  // 
  BitrefillService.prototype.handleDataResponse = function(response, cb) {
    var data = response.data;
    if (data.error) {
      cb(data.error);
    } else if (data.errorMessage) {
      cb(data.errorMessage);
    } else {
      cb(null, data);
    }
  };
  
  BitrefillService.prototype.handleErrorResponse = function(response, cb) {
    $log.error(response.status + ': ' + JSON.stringify(response.data));
    cb(response.status == 500 ? 'Server error' : response.data);
  };
  
  BitrefillService.prototype.request = function(config, cb) {
    config.headers = {
      Authorization: 'Basic ' + $base64.encode(this.api.auth.apiKey + ':' + this.api.auth.apiSecret)
    };
    config.url = this.api.url + config.url;
    $log.debug('bitrefill request: ' + JSON.stringify(config));
    $http(config).then(function successCallback(response) {
      self.handleDataResponse(response, cb);
    }, function errorCallback(response) {
      self.handleErrorResponse(response, cb);
    });

  }

  BitrefillService.prototype.inventory = function(cb) {
    var params = {
      method: 'GET',
      url: this.authurl + "/inventory/"
    };
    
    this.request(params, cb);
  };

  BitrefillService.prototype.lookupNumber = function(number, operator, cb) {
    if (typeof operator == 'function') {
      operator = null;
      cb = operator;
    }
    var params = {
      method: 'GET',
      url: "/lookup_number",
      params: {
        number: number,
        operatorSlug: operator || undefined
      }
    };
    
    this.request(params, cb);
  };

  BitrefillService.prototype.placeOrder = function(number, operator, pack, email, refundAddress, cb) {
    var params = {
      method: "POST",
      url: "/order",
      data: {
        number: number,
        valuePackage: pack,
        operatorSlug: operator,
        email: email,
        refund_btc_address: refundAddress
      }
    };
    
    this.request(params, cb);
  };

  BitrefillService.prototype.orderStatus = function(order_id, cb) {
    var params = {
      method: "GET",
      url: "/order/" + order_id
    };
    
    this.request(params, cb);
  };

  return BitrefillService;
});