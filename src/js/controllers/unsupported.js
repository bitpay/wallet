'use strict';

angular.module('copayApp.controllers').controller('unsupportedController', function($state) {
  if (localStorage && localStorage.length > 0) {
    $state.go('signin');
  }
});
