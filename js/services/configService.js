'use strict';

angular.module('copayApp.services').factory('configService', function(localstorageService, gettextCatalog) {
  var root = {};

  root.set = function(opts, cb) {

    if (opts.logLevel)
      copay.logger.setLevel(opts.logLevel);

    if (opts.defaultLanguage)
      gettextCatalog.currentLanguage = opts.defaultLanguage;

    localstorageService.getItem('config', function(err, oldOpsStr) {

      var oldOpts = {};

      try {
        oldOpts = JSON.parse(oldOpsStr);
      } catch (e) {};

      var newOpts = {};
      _.extend(newOpts, copay.defaultConfig, oldOpts, opts);

      // TODO remove this gloval variable.
      config = newOpts;

      localstorageService.setItem('config', JSON.stringify(newOpts), cb);
    });
  };

  root.reset = function(cb) {
    config = copay.defaultConfig;
    localstorageService.removeItem('config', cb);
  };

  return root;
});
