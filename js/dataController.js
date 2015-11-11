'use strict';

var app = angular.module("statsApp", ["statsApp.dataService"])
  .controller("dataController", function($rootScope, $timeout, dataService) {

    var self = this;
    var config = {};
    var dataSet = [];
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
      dataSet = data;
      dataService.initGraphs(data);
    });

    $('#walletsInterval').change(function() {
      config.graph = 'wallets';
      config.interval = $('#walletsInterval').val();
      config.chart = '#chart-wallets';
      dataService.show(dataSet, config);
    });

    $('#proposalsInterval').change(function() {
      config.graph = 'proposals';
      config.interval = $('#proposalsInterval').val();
      config.chart = '#chart-txps';
      dataService.show(dataSet, config);
    });

    $('#amountInterval').change(function() {
      config.graph = 'amount';
      config.interval = $('#amountInterval').val();
      config.chart = '#chart-amount';
      dataService.show(dataSet, config);
    });

    $rootScope.$on('Data/Finish', function(event) {
      self.loading = false;
      $rootScope.$apply();
    });
  });
