'use strict';

angular.module('copayApp.services').provider('addonManager', function () {
  var addonMenuItems = [];
  var addonViews = [];

  this.registerAddon = function(addonSpec) {
    addonMenuItems.push(addonSpec.menuItem);
    addonViews.push(addonSpec.view);
  };

  this.$get = function() {
    var manager = {};

    manager.addonMenuItems = function() {
      return addonMenuItems;
    };

    manager.addonViews = function() {
      return addonViews;
    };

    return manager;
  }

});
