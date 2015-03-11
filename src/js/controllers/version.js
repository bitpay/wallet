'use strict';

angular.module('copayApp.controllers').controller('versionController', function() {
  this.version = window.version;
  this.commitHash = window.commitHash;
});
