'use strict';

angular.module('copayApp.controllers').controller('payrollSummaryController', function($rootScope, $scope, $timeout, $log, $state, $ionicHistory, $ionicScrollDelegate, lodash, gettextCatalog, ongoingProcess, bitpayService, bitpayAccountService, bitpayPayrollService, popupService, profileService, bitpayInsightService, configService, txFormatService, externalLinkService) {

  var config = configService.getSync().wallet.settings;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    setScope();
  });

  var setScope = function(cb) {
    cb = cb || function(){};
    $scope.payrollRecords = [];

    ongoingProcess.set('loadingPayrollRecords', true);
    bitpayPayrollService.getPayrollRecords(null, function(err, records) {
      ongoingProcess.set('loadingPayrollRecords', false);

      if (err) {
        return showError(err);
      }

      asyncEach(records,
        function(record, callback) {

          if (record.eligibility) {
            $scope.payrollRecords.push(record);
            return callback();

          } else if (record.deduction) {

            // Attach wallet infomation to the payroll record.
            record.deduction.wallet = profileService.getWallet(record.deduction.walletId);

            if (!record.deduction.wallet) {
              getAddressBalanceStr(record.deduction.address, function(balanceStr) {
                record.deduction.wallet = {
                  isExternal: true,
                  name: record.deduction.walletName,
                  status: {
                    totalBalanceStr: balanceStr
                  }
                };
                $scope.payrollRecords.push(record);
                return callback();
              });

            } else {
              $scope.payrollRecords.push(record);
              return callback();
            }
          }
        }, function() {
          // done
          cb();
        }
      );
    });
  };

  $scope.recheckEligibility = function(record) {
    ongoingProcess.set('checkingPayrollEligible', true);
    bitpayPayrollService.recheckIfEligible(record, function(err, record) {
      ongoingProcess.set('checkingPayrollEligible', false);
      if (err) {
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      if (record == null) {
        // Should not happen, but just in case.
        return popupService.showAlert(
          gettextCatalog.getString('No Longer Eligible'),
          gettextCatalog.getString('The email address provided ({email}) is no longer eligible for bitcoin payroll. Please contact your employer and ask them to offer bitcoin payroll through BitPay.'), {
            email: record.eligibility.qualifyingData.email
          }, function() {
            returnToState('tabs.home');
          });
      } else {
        return popupService.showAlert(
          gettextCatalog.getString('Email Sent'),
          gettextCatalog.getString('An email has been sent to {{email}}. Please check and follow the directions in your email to complete payroll setup.', {
            email: record.eligibility.qualifyingData.email
          })
        );
      }
    });
  };

  $scope.stopPayroll = function(record) {
    return popupService.showConfirm(
      gettextCatalog.getString('Cancel Payroll Setup'),
      gettextCatalog.getString('Are you sure you want to cancel bitcoin payroll setup?'), null, null, function(res) {
        if (res) {
          ongoingProcess.set('cancelingPayrollRecord', true);
          bitpayPayrollService.stopPayroll(record, function(err) {
            ongoingProcess.set('cancelingPayrollRecord', false);
            if (err) {
              return showError(err);
            }

            // Go to home if no more payroll records.
            setScope(function() {
              if ($scope.payrollRecords.length == 0) {
                returnToState('tabs.home');
              }
            });
          });
        }
      });
  };

  $scope.setupPayroll = function(record) {
    bindAccountToPayrollService(record.user, function(err, bound) {
      if (err) {
        return showError(err);
      }
      if (bound) {
        $state.go('tabs.payroll.depositAddress', {
          id: record.id
        });
      }
    });
  };

  $scope.viewPayrollDetails = function(record) {
    bindAccountToPayrollService(record.user, function(err, bound) {
      if (err) {
        return showError(err);
      }
      if (bound) {
        $state.go('tabs.payroll.details', {
          id: record.id
        });
      }
    });
  };

  $scope.viewPayrollTransactions = function(record) {
    bindAccountToPayrollService(record.user, function(err, bound) {
      if (err) {
        return showError(err);
      }
      if (bound) {
        $state.go('tabs.payroll.transactions', {
          id: record.id
        });
      }
    });
  };

  $scope.openWallet = function(wallet) {
    if (!wallet.isComplete()) {
      return $state.go('tabs.copayers', {
        walletId: wallet.credentials.walletId
      });
    }

    $state.go('tabs.wallet', {
      walletId: wallet.credentials.walletId
    });
  };

  $scope.viewOnBlockchain = function(address) {
    var url = bitpayInsightService.getEnvironment().url + '/address/' + address;
    var message = gettextCatalog.getString('View Address on Insight');
    var okText = gettextCatalog.getString('Open Insight');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, true, null, message, okText, cancelText);
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

  function bindAccountToPayrollService(user, cb) {
    // Bind appropriate bitpay account to the payroll service.
    bitpayAccountService.getAccount(user.email, function(err, account) {
      if (err) {
        return cb(err);
      }

      if (account) {
        bitpayPayrollService.bindToBitPayAccount(account);
        return cb(null, true);
      }

      // If we don't have the required account and the server indicates that the
      // user account can be paired then start the pairing process.
      if (!account && user.shouldPair) {
        return popupService.showConfirm(
          gettextCatalog.getString('Connect Account'),
          gettextCatalog.getString('Your BitPay account ({{email}}) must be connected to this device. ' +
            'To continue with payroll setup using this email address you will now be redirected to BitPay.com ' +
            'to connect your account with this device.', {
            email: user.email
          }), 'Connect', 'Go Back', function(ok) {
            if (!ok) return;
            bitpayAccountService.startPairBitPayAccount(bitpayService.FACADE_PAYROLL_USER);
          });

      } else {

        popupService.showAlert(
          gettextCatalog.getString('Account not verified'),
          gettextCatalog.getString('Your BitPay account has not been verified by you. Please check your email ({{email}}) and verify your account to continue payroll setup.', {
            email: user.email
          })
        );
        cb(null);
      }
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
