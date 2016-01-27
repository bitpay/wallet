'use strict';

angular.module('copayApp.controllers').controller('confirmTxController', function() {

  this.close = function(cb) {
    return cb();
  };

  this.accept = function(cb) {
    return cb(true);
  };

});
