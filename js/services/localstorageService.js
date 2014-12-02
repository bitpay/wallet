
'use strict';

angular.module('copayApp.services')
  .factory('localstorageService', function($rootScope) {
    var LS = require('../plugins/LocalStorage');
    var ls = new LS();
    return ls;
  });
