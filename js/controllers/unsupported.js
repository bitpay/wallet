'use strict';

angular.module('copayApp.controllers').controller('UnsupportedController',
  function($scope, $location) {

    var localStorage;
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      localStorage = chrome.storage.local;
    } else {
      localStorage = window.localStorage;
    }
    if (localStorage && localStorage.length > 0) {
      $location.path('/');
    }
  }
);
