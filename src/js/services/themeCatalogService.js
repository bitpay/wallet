'use strict';

angular.module('copayApp.services').factory('themeCatalogService', function(storageService, lodash, $log) {

  var root = {};

  var defaultCatalog = {

    service: {
      url: 'http://localhost:3001/cts/api', // TODO
    },

    metadata: {
      themeSchemaVersion: '1',
      skinSchemaVersion: '1'
    },

    themeId: {},
    themes: {},
    skinFor: {}

  };

  var catalogCache = null;

  root.supportsDiscovery = function() {
    // Theme and skin discovery and import requires more storage space than local storage con provide.
    return storageService.isUsingFileStorage();
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

  root.reset = function(cb) {
    catalogCache = lodash.clone(defaultCatalog);
    storageService.removeCatalog(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultCatalog);
  };

  return root;
});