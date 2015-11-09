'use strict';

var app = angular.module("statsApp", ["statsApp.dataService"])
  .controller("dataController", function($rootScope, dataService) {

    var self = this;
    self.loading = true;
    var opts = {};
    opts.url = 'https://bws.bitpay.com/bws/api';
    // var URL = 'http://localhost:3232/bws/api';
    opts.from = '2015-01-01';

    $('#network').change(function() {
      dataService.refresh(opts);
    }).trigger('change');

    $rootScope.$on('Data/Finish', function(event) {
      self.loading = false;
      $rootScope.$apply();
    });
  });
