'use strict';

angular.module('copayApp.services').provider('addonManager', function (lodash) {
  var addons = [];

  this.registerAddon = function(addonSpec) {
    addons.push(addonSpec);
  };

  this.$get = function() {
    var manager = {};

    manager.addonMenuItems = function() {
      return lodash.map(addons, function(addonSpec) {
        return addonSpec.menuItem;
      });
    };

    manager.addonViews = function() {
      return lodash.map(addons, function(addonSpec) {
        return addonSpec.view;
      });
    };

    return manager;
  }

});
