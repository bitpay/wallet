'use strict';
angular.module('copayApp.controllers').controller('pocketsUriController',
  function($rootScope, $stateParams, $location, $timeout, profileService, configService, lodash, signService, go) {

    // Build bitcoinURI with querystring
    this.init = function() {
      var query = [];
      this.pocketsURI = $stateParams.url;

      if (this.pocketsURI) {
        var result = signService.signUriMessage(this.pocketsURI, function(cb) {

            console.log(result);
            }
        );
      }

      // Build pocketsURI with querystrings

        var pocketQuery = [];

        console.log($stateParams);
    };

    this.getWallets = function(network) {
      return profileService.getWallets(network);
    };

  });