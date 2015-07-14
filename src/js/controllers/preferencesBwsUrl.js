'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, configService, isMobile, isCordova, go,  applicationService ) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.bwsurl = config.bws.url;

    this.save = function() {
      var opts = {
        bws: {
          url: this.bwsurl,
        }
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        $scope.$emit('Local/BWSUpdated');
        applicationService.restart();
      });
    };


  });
