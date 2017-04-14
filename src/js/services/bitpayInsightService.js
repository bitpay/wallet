'use strict';

angular.module('copayApp.services').factory('bitpayInsightService', function($log, $http) {
  var root = {};

  var NETWORK = 'livenet';
  var INSIGHT_URL = NETWORK == 'livenet' ? 'https://insight.bitpay.com' : 'https://test-insight.bitpay.com';
  var INSIGHT_API_URL = INSIGHT_URL + '/api/';

  root.getEnvironment = function() {
    return {
      network: NETWORK,
      apiUrl: INSIGHT_API_URL,
      url: INSIGHT_URL
    };
  };

  root.get = function(endpoint, successCallback, errorCallback) {
    $http(_get(endpoint)).then(function(data) {
      successCallback(_errorCheck(data, endpoint), data);
    }, function(data) {
      errorCallback(data);
    });
  };

  root.post = function(endpoint, json, successCallback, errorCallback) {
    $http(_post(endpoint, json)).then(function(data) {
      successCallback(_errorCheck(data, endpoint), data);
    }, function(data) {
      errorCallback(data);
    });
  };

  var _get = function(endpoint) {
    return {
      method: 'GET',
      url: INSIGHT_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _post = function(endpoint, json) {
    return {
      method: 'POST',
      url: INSIGHT_API_URL + endpoint,
      headers: {
        'content-type': 'application/json',
      },
      data: json
    };
  };

  var _errorCheck = function(data, endpoint) {
    if (typeof data.data == 'string' && data.data.match(/^(invalid|error|)$/i)) {
      return {
        data: {
          error: data
        }
      };
    } else {
      return data;
    }
  };

  return root;
  
});
