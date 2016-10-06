var bitauthModule = angular.module('bitauthModule', []);
var bitauth = require('../node_modules/bitauth');

bitauthModule.constant('MODULE_VERSION', '1.0.0');

bitauthModule.provider("bitauthService", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service = bitauth;

    return service;
  };

  return provider;
});
