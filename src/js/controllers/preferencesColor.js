'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController',
  function($scope, configService, profileService, go) {
    var config = configService.getSync();
    this.colorOpts = [
      '#F38F12',
      '#F4D03F',
      '#4A90E2',
      '#484ED3',
      '#9B59B6',
      '#E856EF',
      '#F883B4',
      '#2C3E50',
    ];

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;

    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    this.color = config.colorFor[walletId] || '#2C3E50';

    this.save = function(color) {
      var self = this;
      var opts = {
        colorFor: {}
      };
      opts.colorFor[walletId] = color;

      configService.set(opts, function(err) {
        if (err) console.log(err);
        self.color = color;
        $scope.$emit('Local/ColorUpdated');
      });

    };
  });
