'use strict';

angular.module('copayApp.controllers').controller('UnsupportedController',
  function($scope, $location) {

    var localStorage;
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      console.log('Is a chrome app!');
      localStorage = chrome.storage.local;
    } else {
      console.log('Is web!');
      localStorage = window.localStorage;
    }
    if (localStorage && localStorage.length > 0) {
      $location.path('/');
    }
  }
);
