'use strict';

angular.module('copayApp.controllers').controller('payrollHistoryController', function($scope, $timeout, $log, $state, lodash, bitpayPayrollService, popupService, gettextCatalog, configService) {

  var config = configService.getSync().wallet.settings;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.id) {

      $scope.payrollRecordId = data.stateParams.id;
      $scope.dateRange = {
        value: 'last30Days'
      };

      updateHistoryFromCache(function() {
        $scope.update();
      });

    } else {
      return showError(
        'No payroll record id specified when loading payrollHistoryController',
        gettextCatalog.getString('Error'),
        gettextCatalog.getString('No payroll settings specified.'));
    }
  });

  $scope.update = function() {
    var dateRange = setDateRange($scope.dateRange.value);
    $scope.loadingHistory = true;

    bitpayPayrollService.fetchPayrollRecordHistory($scope.payrollRecordId, dateRange, function(err, transactions) {
      $scope.loadingHistory = false;
      if (err) {
        $scope.transactions = null;
        showError(err);
        return;
      }

      if ($scope.dateRange.value == 'last30Days') {
        $log.debug('Payroll record: store cache history');
        bitpayPayrollService.setPayrollRecordHistory($scope.payrollRecordId, transactions, {}, function(err) {
          if (err) $log.error(err);
          $scope.historyCached = true;
        });
      }
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.formatRate = function(rate) {
    var str = '';

    if (config.unitName == 'bits') {
      str = '1,000,000 bits = ' + rate + ' ' + config.alternativeIsoCode;
    } else {
      str = '1 BTC = ' + rate + ' ' + config.alternativeIsoCode;
    }
    return str;
  };

  var updateHistoryFromCache = function(cb) {
    bitpayPayrollService.getPayrollRecordHistory($scope.payrollRecordId, function(err, data) {
      if (err ||  lodash.isEmpty(data)) return cb();
      $scope.historyCached = true;
      $scope.transactions = data[$scope.payrollRecordId].transactions;
      return cb();
    });
  };

  var setDateRange = function(preset) {
    var startDate, endDate;
    preset = preset ||  'last30Days';
    switch (preset) {
      case 'last30Days':
        startDate = moment().subtract(30, 'days').toISOString();
        endDate = moment().toISOString();
        break;
      case 'lastMonth':
        startDate = moment().startOf('month').subtract(1, 'month').toISOString();
        endDate = moment().startOf('month').toISOString();
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }
    return {
      startDate: startDate,
      endDate: endDate
    };
  };

  function showError(err, title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Could not get payroll transactions.');
    $log.error(err);
    return popupService.showAlert(title, message);
  };

});
