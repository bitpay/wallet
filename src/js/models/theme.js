'use strict';

angular.module('copayApp.model').factory('Theme', function ($log) {

   // Constructor
   // See https://medium.com/opinionated-angularjs/angular-model-objects-with-javascript-classes-2e6a067c73bc#.970bxmciz
  function Theme(obj) {
    this.header = obj.header || {};
    this.resources = obj.resources || [];
    this.view = obj.view || {};
    this.service = obj.service || {};
    this.skins = obj.skins || [];
    return this;
  };

  // Public methods
  // 
  Theme.prototype.canDelete = function() {
    return this.header.permissions['delete'];
  };

  Theme.prototype.setDelete = function(b) {
    this.header.permissions['delete'] = b;
  };

  Theme.prototype.toggleLike = function() {
    this.header.social.iLikeThis = !this.header.social.iLikeThis;
  };

  return Theme;
});