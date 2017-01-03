'use strict';

var app = angular.module("statsApp", ["statsApp.dataService"])
  .controller("dataController", function($rootScope, $timeout, $scope, dataService) {

    var self = this;
    var config = {};
    var dataSet = [];
    var opts = {};
    var defaultDateFrom = '2015-01-01';
    var defaultDateTo = moment().subtract(1, 'days').format('YYYY-MM-DD');
    opts.network = 'livenet';
    opts.url = 'https://bws.bitpay.com/bws/api';
    opts.from = defaultDateFrom;
    opts.to = defaultDateTo;

    init();

    function init() {
      self.loading = true;
      dataService.fetch(opts, function(err, data) {
        if (err) {
          self.error('Could not fetch data');
          return;
        }
        dataSet = data;
        dataService.initGraphs(data);
      });
    }

    $scope.reDraw = function() {
      opts.from = $('#datePickerFrom').val() || defaultDateFrom;
      opts.to = $('#datePickerTo').val() || defaultDateTo;
      init();
    };

    $('#datePickerFrom').val(opts.from);
    $('#datePickerTo').val(opts.to);

    $('#datePickerFrom').Zebra_DatePicker({
      start_date: opts.from,
      show_clear_date: true,
    });

    $('#datePickerTo').Zebra_DatePicker({
      start_date: opts.to,
      show_clear_date: true,
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
