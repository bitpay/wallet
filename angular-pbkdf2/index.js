var pbkdf2Module = angular.module('pbkdf2Module', []);
var pbkdf2Sync = require('../node_modules/pbkdf2').pbkdf2Sync;

pbkdf2Module.constant('MODULE_VERSION', '1.0.0');

pbkdf2Module.provider("pbkdf2Service", function() {
  var provider = {};

  provider.$get = function() {
    var service = {};

    service.pbkdf2Sync = pbkdf2Sync;

    return service;
  };

  return provider;
});
