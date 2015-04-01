'use strict';

angular.module('copayApp.controllers').controller('importLegacyController',
  function($scope, $log, $rootScope, notification, legacyImportService, go) {

    var self = this;

    self.importFromDevice = function(form) {
      var username = form.username.$modelValue;
      var password = form.password.$modelValue;

      legacyImportService.fromDevice(username,password, function(err, n) {
        if (err) {
          self.error = err;
          return;
        } else {
          go.walletHome();
        }
      });
    };
  });
