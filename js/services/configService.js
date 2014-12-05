'use strict';

angular.module('copayApp.services').factory('configService', function(localstorageService) {
  var root = {};

  root.set = function(opts, cb) {
    copay.logger.setLevel(opts.logLevel);
    localstorageService.getItem('config', function(err, oldOps) {

      _.defaults(opts, JSON.parse(oldOps));

      // TODO remove this gloval variable.
      config = opts;
      localstorageService.setItem('config', JSON.stringify(opts), cb);
    });
  };

  root.reset = function(cb) {
    config = copay.defaultConfig;
    localstorageService.removeItem('config',cb);
  };

  return root;
});
