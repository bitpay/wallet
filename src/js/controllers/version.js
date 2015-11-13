'use strict';

angular.module('copayApp.controllers').controller('versionController', function(brand) {
  this.version = brand.version;
});
