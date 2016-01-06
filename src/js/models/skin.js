'use strict';
angular.module('copayApp.model').factory('Skin', function ($log, lodash, BitPayService) {

   // Constructor (See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz)
   // Skin is contructed with it's parent theme.
   // 
  function Skin(obj, theme) {
    this.header = obj.header || {};
    this.resources = obj.resources || [];
    this.view = obj.view || {};
    this.service = obj.service || {};
    this.myTheme = theme;
    return this;
  };

  // Public methods
  // 
  Skin.prototype.canDelete = function() {
    return this.header.permissions['delete'];
  };

  Skin.prototype.setDelete = function(b) {
    this.header.permissions['delete'] = b;
  };

  Skin.prototype.getService = function(kind) {
    var service = null;
    if (!lodash.isUndefined(this.service.kind)) {

      // This skin defines the specified kind of service.
      try {
        service = eval('new ' + this.service.provider.id + 'Service(this.service)');
      } catch (ex) {
        $log.debug('Warning: \'' + this.service.provider.id + '\' provider is not known, verify service configuration for \'' + this.header.name + '\' skin');
      };

    } else if (!lodash.isUndefined(this.myTheme.service.kind)) {

      // The current theme defines the specified kind of service.
      try {
        service = eval('new ' + this.myTheme.service.provider.id + 'Service(this.myTheme.service)');
      } catch (ex) {
        $log.debug('Warning: \'' + this.myTheme.service.provider.id + '\' provider is not known, verify service configuration for \'' + this.myTheme.header.name + '\' theme');
      };

    } else {
      $log.debug('Warning: Cannot find \'' + kind + '\' service for \'' + this.header.name + '\' skin');
    }

    return service;
  };

  Skin.prototype.toggleLike = function() {
    this.header.social.iLikeThis = !this.header.social.iLikeThis;
  };

  return Skin;
});
