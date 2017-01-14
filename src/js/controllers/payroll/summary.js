'use strict';

angular.module('copayApp.controllers').controller('payrollSummaryController', function($rootScope, $scope, $timeout, $log, $state, $ionicHistory, $ionicScrollDelegate, lodash, gettextCatalog, bitpayAccountService, bitpayPayrollService, popupService, profileService, bitpayInsightService, configService, txFormatService, externalLinkService) {

  var config = configService.getSync().wallet.settings;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    bitpayPayrollService.getPayrollRecords(function(err, records) {
      if (err) {
        return showError(err);
      }

      if (!records) {
        return showError(
          'No payroll records found when loading payrollSummaryController',
          gettextCatalog.getString('Error'),
          gettextCatalog.getString('No payroll settings specified.'));
      }

      $scope.payrollRecords = [];

      asyncEach(records,
        function(record, callback) {
          if (record.deduction) {
            if (record.deduction.externalWalletName.length > 0) {
              getAddressBalanceStr(record.deduction.address, function(balanceStr) {
                record.deduction.wallet = {
                  isExternal: true,
                  name: record.deduction.externalWalletName,
                  status: {
                    totalBalanceStr: balanceStr
                  }
                };
                $scope.payrollRecords.push(record);
                return callback();
              });
              return;
            } else {
              record.deduction.wallet = profileService.getWallet(record.deduction.walletId);
            }
          }
          $scope.payrollRecords.push(record);
          return callback();
        }, function() {
          // done
        }
      );
    });
  });

  $scope.recheckEligibility = function(record) {
    bitpayPayrollService.checkIfEligible(record.eligibility.qualifyingData, function(err, record) {
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      if (record == null) {
        // Should not happen, but just in case.
        return popupService.showAlert(
          gettextCatalog.getString('No Longer Eligible'),
          gettextCatalog.getString('The email address provided ({email}) is no longer eligible for bitcoin payroll.<br/><br/>Please contact your employer and ask them to offer bitcoin payroll through BitPay.'), {
            email: record.eligibility.qualifyingData.email
          }, function() {
            returnToState('tabs.home');
          });
      } else {
        return popupService.showAlert(
          gettextCatalog.getString('Email Sent'),
          gettextCatalog.getString('An email has been sent to {{email}}.<br/><br/>Please check and follow the directions in your email to complete payroll setup.', {
            email: record.eligibility.qualifyingData.email
          })
        );
      }
    });
  };

  $scope.startPayroll = function(record) {
    bitpayPayrollService.startPayroll(record, function(err, record) {
      if (err) {
        return showError(err);
      }
      return popupService.showAlert(
        gettextCatalog.getString('Bitcoin Payroll Active!'),
        gettextCatalog.getString('Your next bitcoin payment will be made on {nextEffectiveDate}.', {
          nextEffectiveDate: formatDate(record.employer.nextEffectiveDate)
        })
      );
    });
  };

  $scope.stopPayroll = function(record) {
    return popupService.showConfirm(
      gettextCatalog.getString('Cancel Payroll Setup'),
      gettextCatalog.getString('Are you sure you want to cancel bitcoin payroll setup?'), null, null, function(res) {
        if (res) {
          bitpayPayrollService.stopPayroll(record, function(err) {
            if (err) {
              return showError(err);
            }
            returnToState('tabs.home');
          });
        }
      });
  };

  $scope.setupPayroll = function(record) {
    bindAccountToPayrollService(record.email, function(err) {
      if (err) {
        return showError(err);
      }
      $state.go('tabs.payroll.depositAddress', {
        id: record.id
      });
    });
  };

  $scope.viewPayrollDetails = function(record) {
    bindAccountToPayrollService(record.email, function(err) {
      if (err) {
        return showError(err);
      }
      $state.go('tabs.payroll.details', {
        id: record.id
      });
    });
  };

  $scope.viewPayrollHistory = function(record) {
    bindAccountToPayrollService(record.email, function(err) {
      if (err) {
        return showError(err);
      }
      $state.go('tabs.payroll.history', {
        id: record.id
      });
    });
  };

  $scope.viewOnBlockchain = function(address) {
    var url = bitpayInsightService.getEnvironment().url + '/address/' + address;
    var message = gettextCatalog.getString('View Address on Insight');
    var okText = gettextCatalog.getString('Open Insight');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, true, null, message, okText, cancelText);
  };

  $scope.shouldHideBitcoinAnalysis = function() {
    $scope.hideBitcoinAnalysis = !$scope.hideBitcoinAnalysis;
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.goBackToHome = function() {
    returnToState('tabs.home');
  };

  $scope.goToPayrollIntro = function() {
    $state.go('tabs.payroll');
  };

  $scope.goToPayrollAbout = function(record) {
    $state.go('tabs.payroll.about', {
      id: record.id
    });
  };

  function bindAccountToPayrollService(email, cb) {
    // Bind appropriate bitpay account to the payroll service.
    bitpayAccountService.getAccount(email, function(err, account) {
      if (err) {
        return cb(err);
      }
      bitpayPayrollService.bindToBitPayAccount(account);
      cb(null);
    });
  };

  function getAddressBalanceStr(address, cb) {
    bitpayInsightService.get('/addr/' + address + '/balance', function(data) {
      if (typeof data.data == 'number') {
        return cb(txFormatService.formatAmountStr(parseInt(data.data)));
      } else {
        $log.error('Could not get balance at address from insight: ' + data.data.error);
        return cb('--- ' + config.unitName);
      }
    }, function(data) {
      return cb(_setError('Insight Error: Get Address Balance', data));
    });
  };

  function returnToState(name) {
    for(var viewObj in $ionicHistory.viewHistory().views) {
      if ($ionicHistory.viewHistory().views[viewObj].stateName == name) {
        $ionicHistory.backView($ionicHistory.viewHistory().views[viewObj]);
      }
    }
    $ionicHistory.goBack();
  };

  function formatDate(date) {
    return moment(date).format('MM/DD/YYYY');
  };

  function showError(err, title, message) {
    var title = title || gettextCatalog.getString('Error');
    var message = message || gettextCatalog.getString('Could not save payroll settings.');
    $log.error(err);
    return popupService.showAlert(title, message);
  };

  function _setError(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  function asyncEach(iterableList, callback, done) {
    var i = -1;
    var length = iterableList.length;

    function loop() {
      i++;
      if (i === length) {
        done(); 
        return;
      } else if (i < length) {
        callback(iterableList[i], loop);
      } else {
        return;
      }
    } 
    loop();
  };

});
