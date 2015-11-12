'use strict';

angular.module('copayApp.controllers').controller('versionController', function() {
  this.version = window.appVersion;
  this.commitHash = window.appCommitHash;
});
