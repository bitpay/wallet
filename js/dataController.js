'use strict';

var app = angular.module("statsApp", ["statsApp.dataService"])
  .controller("dataController", function($rootScope, $timeout, dataService) {

    var self = this;
    var opts = {};
    opts.network = 'livenet';
    opts.url = 'https://bws.bitpay.com/bws/api';
    opts.from = '2015-01-01';
    self.loading = true;

    dataService.fetch(opts, function(err, data) {
      if (err) {
        self.error('Could not fetch data');
        return;
      }
      dataService.show(data);
    });

    $rootScope.$on('Data/Finish', function(event) {
      self.loading = false;
      $rootScope.$apply();
    });
  });
