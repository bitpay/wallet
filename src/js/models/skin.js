'use strict';
angular.module('copayApp.model').factory('Skin', function ($log, lodash, Applet) {

   // Constructor
   // Skin is contructed with it's parent theme.
   // 
  function Skin(obj, theme) {
    this.header = obj.header || {};
    this.resources = obj.resources || [];
    this.view = obj.view || {};
    this.applet = obj.applet || {};
    this.theme = theme;
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

  Skin.prototype.toggleLike = function() {
    this.header.social.iLikeThis = !this.header.social.iLikeThis;
  };

  Skin.prototype.isApplet = function() {
    return (!lodash.isEmpty(this.applet));
  };

  Skin.prototype.isVanity = function() {
    return (!lodash.isEmpty(this.view));
  };

  Skin.prototype.getApplet = function() {
    if (!this.isApplet()) {
      return null;
    }
    return new Applet(this.applet, this);
  };

  return Skin;
});
