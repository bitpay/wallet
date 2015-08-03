'use strict';

angular.module('copayApp.services').service('addonManager', function (lodash) {
  var addons = [];

  this.registerAddon = function (addonSpec) {
    addons.push(addonSpec);
  };

  this.addonMenuItems = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.menuItem;
    });
  };

  this.addonViews = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.view;
    });
  };

});
