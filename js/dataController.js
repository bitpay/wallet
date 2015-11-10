'use strict';

var app = angular.module('statsApp', ['statsApp.dataService' , 'uiSwitch'])
  .controller("dataController", function($rootScope, $timeout, $scope, dataService) {

    var self = this;
    var opts = {};
    opts.url = 'https://bws.bitpay.com/bws/api';
    opts.network = 'livenet';
    opts.from = '2015-01-01';
    $scope.network = true;

    self.loading = true;
    dataService.refresh(opts);

    $scope.changeNetwork = function() {
      if($scope.network)
        opts.network = 'livenet';
      else
        opts.network = 'testnet';

      self.loading = true;
      dataService.refresh(opts);
    };

    $rootScope.$on('Data/Finish', function(event) {
      self.loading = false;
      $rootScope.$apply();
    });
  });
