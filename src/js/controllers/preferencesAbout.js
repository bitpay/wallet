'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function(brand) {
    this.shortName = brand.shortName;
    this.version = brand.version;
    this.commitHash = brand.commitHash;
  });
