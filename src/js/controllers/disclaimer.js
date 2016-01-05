'use strict';

angular.module('copayApp.controllers').controller('disclaimerController', function($scope, $log, uxLanguage) {
  this.lang = uxLanguage.currentLanguage;
});
