'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, profileService, go, gettext) {
    this.getMnemonic = function() {
      var fc = profileService.focusedClient;
      var words = fc.getMnemonic();
      if (!words) return;
      return words.split(' ');
    };

    this.done = function() {
        $rootScope.$emit('Local/BackupDone');
    };
  });
