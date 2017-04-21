'use strict';
angular.module('copayApp.services').factory('bitpayPayrollService', function($rootScope, $log, lodash, configService, storageService, bitpayService, bitpayAccountService, bwcService, profileService, walletService, gettextCatalog, homeIntegrationsService, nextStepsService) {

  var root = {};

  var addressVerification = {
    auto:        { verified: true,  reason: 'auto',          accepted: true   },
    notInWallet: { verified: false, reason: 'not-in-wallet', accepted: false  },
    notFound:    { verified: false, reason: 'not-found',     accepted: false  },
    address:     { verified: false, reason: 'address',       accepted: false  }
  };

  var homeItem = {
    name: 'payroll',
    title: 'Payroll',
    icon: 'icon-payroll',
    sref: 'tabs.payroll.summary',
    devMode: true
  };

  var nextStepItem = {
    name: 'payroll',
    title: 'Receive bitcoin in your pay',
    icon: 'icon-payroll',
    sref: 'tabs.payroll',
    devMode: true
  };

  // During payroll setup the bitpayAccount defines the environment for submission of payroll records.
  var bitpayAccount = undefined;

  root.hasAccess = function(accountOrEmail) {
    if (typeof accountOrEmail === 'string') {
      var email = accountOrEmail;
      bitpayAccountService.getAccount(email, function(err, account) {
        if (err) {
          return cb(err);
        }
        if (!account) {
          return cb(err);
        }

        return (bitpayService.getTokenForFacade(bitpayService.FACADE_PAYROLL_USER, account.apiContext.tokens) != undefined);
      });
    } else {
      var account = accountOrEmail;
      return (bitpayService.getTokenForFacade(bitpayService.FACADE_PAYROLL_USER, account.apiContext.tokens) != undefined);
    }
  };

  root.bindToBitPayAccount = function(account) {
    bitpayAccount = account;
  };

  root.unbindBitPayAccount = function() {
    bitpayAccount = undefined;
  };

  // Payroll qualifying data
  // 
  // qualifyingData: {
  //   email: string
  // }
  // 
  // Returns null OR payroll record OR eligibility record
  // 
  // Payroll eligibility record
  // 
  // record: {
  //    user: {
  //      email: string,
  //      verified: boolean
  //   },
  //   employer: {
  //     name: string,
  //     iconUrl: string,
  //     imageUrl: string,
  //     nextEffectiveDate: string,
  //     about: {
  //       message: string,
  //       terms: string,
  //       url: string
  //     }
  //   },
  //   employee: {
  //      label: string,
  //      email: string,
  //      givenName: string,
  //      familyName: string,
  //      verified: boolean
  //   },
  //   eligibility: {
  //     eligible: boolean,
  //     createDate: date,
  //     qualifyingData: {
  //       email: string
  //     }
  //   }
  // }
  root.checkIfEligible = function(qualifyingData, cb, recheckRecordId) {
    // Identify the account to which payroll should eventually be bound.
    var account = {
      email: (bitpayAccount ? bitpayAccount.email : qualifyingData.email)
    }

    var json = {
      method: 'checkPayrollEligible',
      params: JSON.stringify({
        qualifyingData: qualifyingData,
        account: account
      })
    };

    bitpayService.post(bitpayService.FACADE_PUBLIC, '', json, function(data) {
      if (data && data.data.error) {
        return cb(_setError('BitPay service', data));
      }
      $log.info('BitPay Check Payroll Eligible: SUCCESS');
      var record = data.data.data;

      if (record && record.eligibility && record.eligibility.eligible) {
        // Set the record id if we're rechecking eligiblity (forces a cache update).
        if (recheckRecordId) {
          record.id = record.eid = recheckRecordId;
        }

        // If there is no user account context but a verified account exists then indicate that
        // account pairing should start.
        record.user.shouldPair = !bitpayAccount && record.user.verified;

        cacheEligibilityRecord(record, function(err) {
          register(true); // Update home view.
          cb(err, record);
        });

      } else if (record && record.eligibility) {
        cb(null, record);

      } else {
        cb('an unexepected error occurred');

      }
    }, function(data) {
      return cb(_setError('BitPay service', data));
    });
  };

  root.recheckIfEligible = function(record, cb) {
    return root.checkIfEligible(record.eligibility.qualifyingData, cb, record.id);
  };

  // Payroll record
  // 
  // record: {
  //   eid: string,
  //   user: {
  //     email: string
  //   },
  //   employer: {
  //     name: string,
  //     iconUrl: string,
  //     imageUrl: string,
  //     nextEffectiveDate: date,
  //   },
  //   employee: {
  //     label: string,
  //     email: string,
  //     givenName: string,
  //     familyName: string
  //   },
  //   deduction: {
  //     active: boolean,
  //     address: string,
  //     walletId: string,
  //     walletName: string,
  //     amount: float,
  //     currency: string,
  //     addressVerification: {
  //       verified: boolean,
  //       reason: string,
  //       accepted: boolean
  //     }
  //   }
  // }
  root.startPayroll = function(record, cb) {
    var _start = function(record, cb) {
      // Perform address verification.
      verifyAddress(record, function(record) {

        // Activate the record.
        record.deduction.active = true;

        // Tell BitPay to start payroll.
        postPayrollRecord(record, function(err, newRecord) {
          if (err) {
            return cb(_setError('Could not start payroll', err));
          }

          // Payroll started on server.
          // If starting from an eligibility record then remove the eligibility record.
          if (record.eligibility) {
            removeEligibilityRecord(record.id, function(err) {
              if (err) {
                _setError('Failed to remove eligibility record after starting payroll', err);
                // Not fatal but may cause app problems or user confusion -- continue
              }
            });
          }

          cachePayrollRecord(record, cb);
        });
      });
    };

    // Using a wallet?
    if (record.deduction.walletId.length > 0) {
      // Restrict the wallet from being deleted while payroll is bound.
      // Prevent payroll from starting unless this restriction is in place.
      walletService.setRestrictions(record.deduction.walletId, ['delete:payroll-deposit'], function(err) {
        if (err) {
          // Not being able to remove the restriction is not fatal since the wallet may simply be no longer "installed"
          // here or is installed on another device.
          $log.warn('Could not set wallet restriction (payroll): ' + JSON.stringify(err));
        }
        _start(record, cb);
      });

    } else {
      _start(record, cb);
    }
  };

  root.pausePayroll = function(record, cb) {
    record.deduction.active = false;
    postPayrollRecord(record, cb);
  };

  root.stopPayroll = function(record, cb) {
    if (!record) {
      return cb(_setError('Could not stop payroll', 'Unexpected error'));
    }

    if (record.eligibility) {
      // Payroll setup never started, record was cached only locally; remove the record from our cache.
      removeEligibilityRecord(record.id, cb);
    } else {
      // Payroll setup started, record was created at the server; archive on the server.
      archivePayrollRecord(record, function(err) {
        if (err) {
          cb(err);
        }

        // Using a wallet?
        if (record.deduction.walletId.length > 0) {
          // Remove delete restriction on the wallet.
          walletService.removeRestrictions(record.deduction.walletId, ['delete:payroll-deposit'], function(err) {
            if (err) {
              // Not being able to remove the restriction is not fatal since the wallet may simply be no longer "installed"
              // here or is installed on another device.
              $log.warn('Could not remove wallet restriction (payroll): ' + JSON.stringify(err));
            }
            cb();
          });
        } else {
          cb();
        };
      });
    }
  };

  root.acceptUnverifiedAddress = function(record, cb) {
    record.deduction.addressVerification.accepted = true;
    postPayrollRecord(record, cb);
  };

  root.getPayrollRecordById = function(id, cb) {
    getRecordCache(function(err, records) {
      if (err) return cb(err);
      var record = lodash.find(records, function(r) {
        return r.id == id;
      });
      cb(null, record);
    });
  };

  // Retrieve payroll records from the server and cache locally.  If the server is not able to be
  // reached then try to return cache values.  By not providing an apiContext the cache value is
  // automatically returned.
  root.getPayrollRecords = function(accountOrEmail, cb) {
    if (accountOrEmail == null) {
      // When no account context is specified then attempt to refresh all cached payroll records.
      if (!account) {
        return refreshRecordCache(function(err) {
          if (err) {
            $log.error('Could not refresh payroll record cache: ' + err);
          }
          getRecordCache(function(err, records) {
            if (err) {
              return cb(_setError('Could not get payroll records', records));
            }
            return cb(null, records);
          });
        });
      }
    } else if (typeof accountOrEmail === 'string') {
      var email = accountOrEmail;
      bitpayAccountService.getAccount(email, function(err, account) {
        if (err) {
          return cb(err);
        }
        fetchPayrollRecords(account, cb);
      });
    } else if (typeof accountOrEmail === 'object') {
      var account = accountOrEmail;
      fetchPayrollRecords(account, cb);
    }
  };

  root.removePayrollRecord = function(recordId, cb) {
    storageService.removePayrollRecord(bitpayService.getEnvironment().network, recordId, function(err) {
      if (err) {
        $log.error('Error removing payroll record: ' + err);
      }
      // If there are no more records in storage then re-register our service.
        root.getPayrollRecords(null, function(err, records) {
        if (err) {
          $log.error('Error getting payroll records after remove: ' + err);
          // Continue
        }
        register(records.length > 0); // Update home view.
        return cb();
      });
    });
  };

  // Payroll transactions
  // 
  // data: {
  //   'eid': { // payroll record id
  //     transactions: [{
  //       uniqueId,
  //       timestamp,
  //       amount,
  //       currency,
  //       rate,
  //       btc,
  //       status,
  //       address,
  //     }]
  //   }
  // }
  root.getPayrollTransactions = function(record, dateRange, cb) {
    var json = {
      method: 'getTransactions',
      params: JSON.stringify({
        recordId: record.id,
        dateRange: dateRange
      })
    };
    // Get payroll transactions
    bitpayService.post(bitpayService.FACADE_PAYROLL_USER_RECORD, record.token, json, function(data) {
      if (data && data.data.error) {
/*
        // Could not get transactions from server, try to return local cache.
        getTransactionCache(record.id, function(err, txData) {
          if (err) {
            return cb(_setError('Could not get payroll transactions', err));
          }
          return cb(null, txData);
        });
*/
        return cb(_setError('BitPay service', data));
      }
      $log.info('BitPay Get Payroll Transactions: SUCCESS');
      // Cache payroll records in storage.
      var txData = data.data.data;
      cachePayrollTransactions(txData, record.id, function(err) {
        return cb(err, txData);
      });
    }, function(data) {
      return cb(_setError('BitPay service', data));
    });
  };

  /*
   *
   * Private functions
   *
   */

  var fetchPayrollRecords = function(account, cb) {
    var unwrapRecords = function(records) {
      // Remove facade wrapper for each record.
      var unwrappedRecords = [];
      for (var i = 0; i < records.length; i++) {
        unwrappedRecords.push(records[i].data);
      }
      return unwrappedRecords;
    };

    // Get payroll records for user account from the server.
    var json = {
      method: 'getPayrollRecords'
    };

    var endpoint = bitpayService.getTokenForFacade(bitpayService.FACADE_PAYROLL_USER, account.apiContext.tokens).token;
    bitpayService.post(bitpayService.FACADE_PAYROLL_USER, endpoint, json, function(data) {
      if (data && data.data.error) {
        // Could not get records from server, try to return local cache.
        return getRecordCache(function(err, records) {
          if (err) {
            return cb(_setError('BitPay service', data));
          }
          $log.info('BitPay Get Payroll Records: returned CACHE');
          return cb(null, records);
        });
      }
      $log.info('BitPay Get Payroll Records: SUCCESS');

      // Cache payroll records in storage.
      var records = unwrapRecords(data.data.data);

      cachePayrollRecordsOnAccount(account.apiContext.pairData.email, records, function(err) {
        if (err) {
          return cb(_setError('Could not get payroll records', err));
        }
        register(records.length > 0); // Update home view.
        return cb(null, records);
      });
    }, function(data) {
      return cb(_setError('BitPay service', data));
    });
  };

  var cacheEligibilityRecord = function(record, cb) {
    // Replace existing record.
    if (record.eid) {
      storageService.updatePayrollEligibilityRecord(bitpayService.getEnvironment().network, record, function(err) {
        return cb(err);
      });
    } else {
      // Eligibility records don't have an id so create one here for record identification.
      record.eid = record.id = Date.now();
      return storageService.addPayrollEligibilityRecord(bitpayService.getEnvironment().network, record, cb);
    }
  };

  var removeEligibilityRecord = function(recordId, cb) {
    storageService.removePayrollEligibilityRecord(bitpayService.getEnvironment().network, recordId, function(err) {
      if (err) {
        $log.error('Error removing payroll eligibility record: ' + err);
        return cb(err);
      }
      // If there are no more records in storage then re-register our service.
        root.getPayrollRecords(null, function(err, records) {
        if (err) {
          $log.error('Error getting payroll records after remove: ' + err);
          cb(err);
          // Continue
        }
        register(records.length > 0); // Update home view.
        return cb();
      });
    });
  };

  var cachePayrollRecordsOnAccount = function(email, records, cb) {
    // Use the server eid as our local record id.
    for (var i = 0; i < records.length; i++) {
      records[i].id = records[i].eid;
    }
    storageService.setPayrollRecordsOnAccount(bitpayService.getEnvironment().network, email, records, function(err) {
      if (err) return cb(err);
      return cb(null, records);
    });
  };

  var cachePayrollRecord = function(record, cb) {
    // Use the server eid as our local record id.
    record.id = record.eid;
    storageService.updatePayrollRecord(bitpayService.getEnvironment().network, record, function(err) {
      if (err) return cb(err);
      return cb(null, record);
    });
  };

  // Return payroll records from local cache. Looks across all paired accounts, includes eligibility records.
  var getRecordCache = function(cb) {
    storageService.getPayrollRecords(bitpayService.getEnvironment().network, function(err, pRecords) {
      if (err) return cb(err);
      storageService.getPayrollEligibilityRecords(bitpayService.getEnvironment().network, function(err, eRecords) {
        if (err) return cb(err);
        return cb(null, eRecords.concat(pRecords) || []);
      });
    });
  };

  // Refresh payroll records from the server; does not refresh eligibility records.
  var refreshRecordCache = function(cb) {
    getRecordCache(function(err, records) {
      if (err) {
        return cb(err);
      }
      asyncEach(records, function(record, callback) {
        if (!record.token) {
          // Eligibility records don't have tokens; skip these records.
          return callback();
        }

        bitpayService.get(bitpayService.FACADE_PAYROLL_USER_RECORD, record.token, function(data) {
          if (data && data.data.error) {
            return cb(data.data.error);
          } else {
            $log.info('BitPay Get Payroll Record: SUCCESS');
            var record = data.data.data;
            record.id = record.eid;  // Use the server eid as our local record id.
            storageService.updatePayrollRecord(bitpayService.getEnvironment().network, record, function(err) {
              if (err) return cb(err);
              callback();
            });
          }
        }, function(data) {
          return cb(_setError('BitPay service', data));
        });
        }, function() {
          // done
          return cb();
      });
    });
  };

  var cachePayrollTransactions = function(txData, recordId, cb) {
    storageService.getPayrollTransactions(bitpayService.getEnvironment().network, function(err, data) {
      if (err) return cb(err);
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      data[recordId] = txData;
      storageService.setPayrollTransactions(bitpayService.getEnvironment().network, data, function(err) {
        if (err) return cb(err);
        return cb();
      });
    });
  };

  var getTransactionCache = function(recordId, cb) {
    storageService.getPayrollTransactions(bitpayService.getEnvironment().network, function(err, data) {
      if (err) return cb(err);
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (recordId) {
        data = data[recordId];
      }
      return cb(null, data);
    });
  };

  var verifyAddress = function(record, cb) {
    if (record.deduction) {
      if (record.deduction.walletId) {

        // Check to see if the wallet is stored locally.
        var wallets = profileService.getWallets({
          onlyComplete: true,
          network: 'livenet'
        });

        var wallet = lodash.find(wallets, function(w) {
          return w.id == record.deduction.walletId;
        });

        if (wallet) {

          // Verify that the address is contained in the specified wallet.
          return wallet.getMainAddresses(null, function(err, addresses) {
            if (err) {
              $log.warn('Could not verify payroll addresses; failed to get wallet addresses: ' + JSON.stringify(err));
              // Continue. Address verification failures are not fatal.
            }

            var index = lodash.findIndex(addresses, function(address) {
              return address.address == record.deduction.address;
            });

            if (index >= 0) {
              record.deduction.addressVerification = addressVerification.auto;
              $log.info('Payroll deposit address verified to be in wallet; address: ' + record.deduction.address + ',  wallet: ' + record.deduction.walletId);
            } else {
              // The specified address is not in the wallet we found.
              record.deduction.addressVerification = addressVerification.notInWallet;
              $log.warn('Payroll deposit address not in specified wallet; address: ' + record.deduction.address + ',  wallet: ' + record.deduction.walletId);
            }
            cb(record);
          });

        } else {
          // No wallet found locally for a specified wallet id.
          record.deduction.addressVerification = addressVerification.notFound;
          $log.warn('Payroll deposit wallet is not found; walletId: ' + record.deduction.walletId + ' address: ' + record.deduction.address);
        }
      } else {
        // User provided an address, not a wallet.
        record.deduction.addressVerification = addressVerification.address;
        $log.warn('Payroll deposit address could not be automatically verified:' + record.deduction.address);
      }
    }
    cb(record);
  };
  
  var postPayrollRecord = function(record, cb) {
    var _filter = function (record) {
      return {
        user: {
          email: record.user.email
        },
        employee: {
          label: record.employee.label,
          email: record.employee.email
        },
        deduction: {
          address: record.deduction.address,
          walletId: record.deduction.walletId,
          walletName: record.deduction.walletName,
          amount: record.deduction.amount,
          currency: record.deduction.currency,
          active: record.deduction.active,
          addressVerification: record.deduction.addressVerification
        }
      };
    };

    var updateExisting = (record.eid != undefined);

    var method = 'createPayrollRecord';
    var facadeName = bitpayService.FACADE_PAYROLL_USER;
    var endpoint = bitpayService.getTokenForFacade(facadeName, bitpayAccount.apiContext.tokens).token;

    if (updateExisting) {
      method = 'set';
      facadeName = bitpayService.FACADE_PAYROLL_USER_RECORD;
      endpoint = record.token;
    }

    var json = {
      method: method,
      params: JSON.stringify({
        record: _filter(record)
      })
    };

    bitpayService.post(facadeName, endpoint, json, function(data) {
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Set Payroll Record: SUCCESS');

      var record = data.data.data;
      if (!record.eid) {
        return cb(_setError('BitPay service', 'No eid on payroll record'));
      }

      cachePayrollRecord(record, function(err) {
        cb(err, record);
      });
    }, function(data) {
      return cb(_setError('BitPay service', data));
    });
  };

  var archivePayrollRecord = function(record, cb) {
    var json = {
      method: 'archive'
    };

    bitpayService.post(bitpayService.FACADE_PAYROLL_USER_RECORD, record.token, json, function(data) {
      if (data && data.data.error) {
        return cb(_setError('BitPay service', data));
      }
      $log.info('BitPay Archive Payroll Record: SUCCESS');

      cachePayrollRecord(record, function(err) {
        cb(err, record);
      });
    }, function(data) {
      return cb(_setError('BitPay service', data));
    });
  };

  var register = function(hasRecords) {
    if (hasRecords) {
      nextStepsService.unregister(nextStepItem.name);
      homeIntegrationsService.register(homeItem);
    } else {
      homeIntegrationsService.unregister(homeItem.name);
      nextStepsService.register(nextStepItem);
    }
  };

  var _setError = function(msg, e) {
    var error = msg;
    if (e && e.data && e.data.error) {
      error = msg + ': ' + e.data.error;
    } else if (e && e.statusText) {
      error = msg + ': ' + e.statusText;
    } else if ('string' == typeof e) {
      error = msg + ': ' + e;
    } else if ('object' == typeof e) {
      $log.error(error);
      $log.error(JSON.stringify(e));
    } else {
      $log.error(error);
    }
    return error;
  };

  var asyncEach = function(iterableList, callback, done) {
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

  $rootScope.$on('Local/DeveloperMode', function() { ///////////////////////////////// TODO

    // Register our service properly at startup.
    root.getPayrollRecords(null, function(err, records) {
      if (err) {
        cb(_setError(err));
      }
      register(records.length > 0);
    });

  });

  return root;

});
