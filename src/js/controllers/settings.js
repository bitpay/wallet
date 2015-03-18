'use strict';

angular.module('copayApp.controllers').controller('settingsController', function(configService, applicationService) {
  var config;
  
  this.init = function() {
    config = configService.get();
    this.bws = config.bws.url;
  };

  this.save = function() {
    if (!this.bws) return;
    config.bws.url = this.bws;
    var res = configService.set(config);
    if (res) {
      applicationService.restart();
    }
  };

  this.reset = function() {
    if (configService.reset()) {
      applicationService.restart();
    }
  };

});
