'use strict';

angular.module('copayApp.services').factory('themeCatalogService', function(storageService, lodash, $log, brand) {

  var root = {};

  var defaultCatalog = {

    service: {
      url: 'http://54.175.239.60:3001/cts/api', //'http://localhost:3001/cts/api', // TODO
    },

    metadata: {
      themeSchemaVersion: brand.features.theme.requiredSchema
    },

    themes: {}

  };

  var catalogCache = null;

  root.getRequiredSchema = function() {
    return brand.features.theme.requiredSchema;
  };

  root.isCatalogCompatible = function() {
    return root.getRequiredSchema() == root.getSync().metadata.themeSchemaVersion;
  };

  root.supportsWritingThemeContent = function() {
    // Theme and skin discovery and import requires more storage space than local storage can provide.
    return storageService.fileStorageAvailable();
  }

  root.getApplicationDirectory = function() {
    return storageService.getApplicationDirectory();
  };

  root.getSync = function() {
    if (!catalogCache)
      throw new Error('themeCatalogService#getSync called when cache is not initialized');
    return catalogCache;
  };

  root.get = function(cb) {
    storageService.getThemeCatalog(function(err, localCatalog) {
      if (localCatalog) {
        catalogCache = JSON.parse(localCatalog);
      } else {
        catalogCache = lodash.clone(defaultCatalog);
      };
      $log.debug('Theme catalog read:', catalogCache)
      return cb(err, catalogCache);
    });
  };

  root.set = function(newCat, cb) {
    var catalog = defaultCatalog;
    storageService.getThemeCatalog(function(err, oldCat) {
      if (lodash.isString(oldCat)) {
        if (oldCat.length == 0)
          oldCat = '{}';
        oldCat = JSON.parse(oldCat);
      }
      if (lodash.isString(catalog)) {
        catalog = JSON.parse(catalog);
      }
      if (lodash.isString(newCat)) {
        newCat = JSON.parse(newCat);
      }
      lodash.merge(catalog, oldCat, newCat);
      catalogCache = catalog;

      storageService.storeThemeCatalog(JSON.stringify(catalog), cb);
    });
  };

  root.replace = function(newCat, cb) {
    var catalog = defaultCatalog;
    storageService.getThemeCatalog(function(err, oldCat) {
      if (lodash.isString(oldCat)) {
        if (oldCat.length == 0)
          oldCat = '{}';
        oldCat = JSON.parse(oldCat);
      }
      if (lodash.isString(catalog)) {
        catalog = JSON.parse(catalog);
      }
      if (lodash.isString(newCat)) {
        newCat = JSON.parse(newCat);
      }
      lodash.assign(catalog, oldCat, newCat);
      catalogCache = catalog;

      storageService.storeThemeCatalog(JSON.stringify(catalog), cb);
    });
  };

  root.reset = function(cb) {
    catalogCache = lodash.clone(defaultCatalog);
    storageService.removeCatalog(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultCatalog);
  };

  return root;
});
