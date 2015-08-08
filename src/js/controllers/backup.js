'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, profileService, go, gettext) {
    this.getMnemonic = function() {
      var fc = profileService.focusedClient;
      var words = fc.getMnemonic();
console.log('[backup.js.7:words:]',words); //TODO
      if (!words) return;

      return words.split(' ');
    };
  });
