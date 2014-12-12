'use strict';

angular.module('copayApp.services').factory('configService', function($timeout, localstorageService, gettextCatalog, defaults) {
  var root = {};

  root.set = function(opts, cb) {

    // Options that have runtime effects
    if (opts.logLevel)
      copay.logger.setLevel(opts.logLevel);

    if (opts.defaultLanguage)
      gettextCatalog.currentLanguage = opts.defaultLanguage;

    // Set current version
    opts.version = copay.version;

    localstorageService.getItem('config', function(err, oldOpsStr) {
      var oldOpts = {};
      try {
        oldOpts = JSON.parse(oldOpsStr);
      } catch (e) {};

      var newOpts = {};
      _.extend(newOpts, copay.defaultConfig, oldOpts, opts);

      // TODO remove this global variable.
      config = newOpts;
      localstorageService.setItem('config', JSON.stringify(newOpts), cb);
    });
  };

  root.reset = function(cb) {
    config = defauls;
    localstorageService.removeItem('config', cb);
  };

  return root;
});
