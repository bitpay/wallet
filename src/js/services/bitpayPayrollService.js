'use strict';
angular.module('copayApp.services').factory('bitpayPayrollService', function($log, lodash, configService, storageService, bitpayService, bwcService, profileService, walletService, gettextCatalog, homeIntegrationsService, nextStepsService) {

  var root = {};

  var addressVerification = {
    auto:        { verified: true,  reason: 'auto' },
    notInWallet: { verified: false, reason: 'not-in-wallet' },
    notFound:    { verified: false, reason: 'not-found' },
    unknown:     { verified: false, reason: 'unknown' }
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

  root.bindToBitPayAccount = function(account) {
    bitpayAccount = account;
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
  //   email: string,
  //   employer: {
  //     eid: string,
  //     id: string,
  //     name: string,
  //     iconUrl: string, 
  //     imageUrl: string
  //   },
  //   eligibility: {
  //     createDate: date,
  //     verified: boolean,
  //     qualifyingData: {
  //       email: string
  //     }
  //   }
  // }
  root.checkIfEligible = function(qualifyingData, cb) {
    var registerAndCallback = function(err, record) {
      register(); // Update home view.
      cb(err, record);
    };

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

    bitpayService__post('', json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Check Payroll Eligible: SUCCESS');
      var record = data.data.data;

      if (record && record.eligibility) {
        // If there is an account context then fetch any payroll records created on the account.
        if (bitpayAccount) {
          root.getPayrollRecords(bitpayAccount.apiContext, function(err, records) {
            if (err) return cb(err);
            // If there exists a payroll record that matches the qualifying data then dump the eligibility
            // record.
            var payrollRecord = lodash.find(records, function(r) {
              return r.email == record.email;
            });
            
            if (payrollRecord) {
              cb(null, payrollRecord);
            } else {
              // Cache the payroll eligibility record.
              cacheEligibilityRecord(record, function(err) {
                registerAndCallback(err, record);
              });
            }
          });
        } else {
          // Cache the payroll eligibility record.
          cacheEligibilityRecord(record, function(err) {
            registerAndCallback(err, record);
          });
        }
      } else {
        cb(null, null);
      }
    }, function(data) {
      return cb(_setError('BitPay Account Error: Check Payroll Eligible', data));
    });
  };

  // Payroll record
  // 
  // record: {
  //   token: string,
  //   eid: string,
  //   id: string,
  //   email: string,
  //   employer: {
  //     eid: string,
  //     id: string,
  //     name: string,
  //     iconUrl: string,
  //     imageUrl: string,
  //     nextEffectiveDate: date,
  //     payCycle: string
  //   },
  //   employee: {
  //     refId: string,
  //     email: string,
  //     firstName: string,
  //     lastName: string
  //   },
  //   deduction: {
  //     active: boolean,
  //     address: string,
  //     walletId: string,
  //     amount: float,
  //     currency: string,
  //     externalWalletName: string,
  //     addressVerification: {
  //       verified: boolean,
  //       reason: string,
  //       accepted: boolean
  //     }
  //   }
  // }
  root.startPayroll = function(record, cb) {
    // Delete the eligibility data when we start.
    delete record.eligibility;
    record.deduction.active = true;
    record.deduction.addressVerification = { accepted: false };

    // Restrict the wallet from being deleted while payroll is bound.
    // Prevent payroll from starting unless this restriction is in place.
    walletService.setRestrictions(record.deduction.walletId, ['delete:payroll-deposits'], function(err) {
      if (err) {
        return cb(_setError('Error starting payroll: ' + err));
      }
      root.updatePayroll(record, cb);
    });
  };

  root.pausePayroll = function(record, cb) {
    record.deduction.active = false;
    root.updatePayroll(record, cb);
  };

  root.stopPayroll = function(record, cb) {
    if (!record) {
      return cb(_setError('Error stopping payroll: payroll record malformed'));
    }

    if (record.eligibility) {
      // Payroll setup never started, record was cached only locally; remove the record from our cache.
      storageService.removePayrollEligibilityRecord(bitpayService.getEnvironment().network, record.email, cb);
      register(); // Update home view.
    } else {
      // Payroll setup started, record was created at the server; delete from the server.
      deletePayrollRecord(record.id, function(err) {
        if (err) {
          return cb(_setError('Error starting payroll: ' + err));
        }
        // Remove restriction to delete the wallet.
        walletService.removeRestrictions(record.deduction.walletId, ['delete:payroll-deposits'], function(err) {
          if (err) {
            return cb(_setError('Error removing wallet restriction (payroll): ' + err));
          }
          cb();
        });
      });      
    }
  };

  root.updatePayroll = function(record, cb) {
    postPayrollRecord(record, cb);
  };

  root.acceptUnverifiedAddress = function(record, cb) {
    record.deduction.addressVerification.accepted = true;
    root.updatePayroll(record, cb);
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
  root.getPayrollRecords = function(apiContext, cb) {
    // When no api context is specified then return only the local cache.
    if (!apiContext) {
      return getRecordCache(function(err, records) {
        if (err) return cb(data.data.error);
        return cb(null, records);
      });
    }

    var json = {
      method: 'getPayrollRecords'
    };
    // Get payroll records
    bitpayService__post(apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) {
        // Could not get records from server, try to return local cache.
        getRecordCache(function(err, records) {
          if (err) return cb(data.data.error);
          return cb(null, records);
        });
      }
      $log.info('BitPay Account Get Payroll Records: SUCCESS');
      // Cache payroll records in storage.
      var records = data.data.data;

      checkAddress(records, function(err, records) {
        if (err) return cb(err);
        cachePayrollRecords(apiContext.pairData.email, records, function(err) {
          register(); // Update home view.
          return cb(err, records);
        });
      });
    }, function(data) {
      return cb(_setError('BitPay Account Error: Get Payroll Records', data));
    });
  };

  root.removePayrollRecord = function(id, cb) {
    storageService.removePayrollRecord(bitpayService.getEnvironment().network, id, function(err) {
      if (err) {
        $log.error('Error removing payroll record: ' + err);
      }
      // If there are no more records in storage then re-register our service.
        root.getPayrollRecords(null, function(err, records) {
        if (err) {
          $log.error('Error getting payroll records after remove: ' + err);
          // Continue
        }
        if (records.length == 0) {
          register(); // Update home view.
        }
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
  root.getPayrollRecordHistory = function(recordId, dateRange, cb) {
    var json = {
      method: 'getPayrollTransactions',
      params: JSON.stringify({
        recordId: recordId,
        dateRange: dateRange
      })
    };
    // Get payroll transactions
    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) {
        // Could not get history from server, try to return local cache.
        getHistoryCache(recordId, function(err, history) {
          if (err) return cb(data.data.error);
          return cb(null, history);
        });
      }
      $log.info('BitPay Account Get Payroll Transactions: SUCCESS');
      // Cache payroll records in storage.
      var txData = data.data.data;
      cachePayrollTransactions(txData, recordId, function(err) {
        return cb(err, txData);
      });
    }, function(data) {
      return cb(_setError('BitPay Account Error: Get Payroll Transactions', data));
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

  var getHistoryCache = function(recordId, cb) {
    storageService.getPayrollRecordsHistory(bitpayService.getEnvironment().network, function(err, data) {
      if (err) return cb(err);
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (recordId) data = data[recordId];
      return cb(null, data);
    });
  };

  var cacheEligibilityRecord = function(record, cb) {
    // Replace existing record (keyed by email).
    storageService.removePayrollEligibilityRecord(bitpayService.getEnvironment().network, record.email, function() {
      // Eligibility records don't have an id so create one here for record identification.
      record.eid = record.id = Date.now();
      storageService.addPayrollEligibilityRecord(bitpayService.getEnvironment().network, record, cb);
    });
  };

  var cachePayrollRecords = function(email, records, cb) {
    storageService.setPayrollRecords(bitpayService.getEnvironment().network, email, records, function(err) {
      if (err) return cb(err);
      return cb();
    });
  };

  var cachePayrollTransactions = function(txData, recordId, cb) {
    storageService.getPayrollRecordsHistory(bitpayService.getEnvironment().network, function(err, data) {
      if (err) return cb(err);
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      data[recordId] = txData;
      storageService.setPayrollRecordsHistory(bitpayService.getEnvironment().network, data, function(err) {
        if (err) return cb(err);
        return cb();
      });
    });
  };

  var checkAddress = function(records, cb) {
    for (var i = 0; i < records.length; i++) {
      if (records[i].deduction) {
        if (records[i].deduction.walletId) {

          // Check to see if the wallet is stored locally.
          var wallets = profileService.getWallets({
            onlyComplete: true,
            network: 'livenet'
          });

          var wallet = lodash.find(wallets, function(w) {
            return w.id == records[i].deduction.walletId;
          });

          if (wallet) {
            // Verify that the address is contained in the specified wallet.
            // var addressObj = bwcService.getClient().getAddressFromWallet(records[i].deduction.walletId, address); // TODO
            var addressObj = {};

            if (addressObj) {
              lodash.merge(records[i].deduction.addressVerification, addressVerification.auto);
              $log.warn('Payroll deposit address not in specified wallet; address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            } else {
              // The specified address is not in the wallet we found.
              lodash.merge($records[i].deduction.addressVerification, addressVerification.notInWallet);
              $log.warn('Payroll deposit address not in specified wallet; address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            }
          } else {
            // No wallet found locally for a specified wallet id.
            lodash.merge(records[i].deduction.addressVerification, addressVerification.notFound);
            $log.warn('Payroll deposit wallet is external; walletId: ' + records[i].deduction.walletId + ' address: ' + records[i].deduction.address);
          }
        } else {
          // User provided an address only, not a wallet.
          lodash.merge(records[i].deduction.addressVerification, addressVerification.unknown);
          $log.warn('Payroll deposit address could not be verified:' + records[i].deduction.address);
        }
      }
    }
    cb(null, records);
  };
  
  var postPayrollRecord = function(record, cb) {
    var json = {
      method: 'setPayrollRecord',
      params: JSON.stringify({
        record: record
      })
    };

    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Set Payroll Record: SUCCESS');

      // Re-cache payroll records after the server updates.
      root.getPayrollRecords(bitpayAccount.apiContext, function(err, records) {
        if (err) return cb(err);
        var updatedRecord = lodash.find(records, function(r) {
          return r.eid == record.eid;
        });

        if (!updatedRecord) {
          return cb(_setError('Could not find payroll record after server update: ' + record.eid));
        }
        return cb(null, updatedRecord);
      });
    }, function(data) {
      return cb(_setError('BitPay Account Error: Set Payroll Record', data));
    });
  };

  var deletePayrollRecord = function(recordId, cb) {
    var json = {
      method: 'deletePayrollRecord',
      params: JSON.stringify({
        recordId: recordId
      })
    };

    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Delete Payroll Record: SUCCESS');

      // Re-cache payroll records after the server updates.
      root.getPayrollRecords(bitpayAccount.apiContext, function(err, records) {
        return cb(err);
      });
    }, function(data) {
      return cb(_setError('BitPay Account Error: Delete Payroll Record', data));
    });
  };

  var register = function() {
    root.getPayrollRecords(null, function(err, records) {
      if (records.length > 0) {
        nextStepsService.unregister(nextStepItem.name);
        homeIntegrationsService.register(homeItem);
      } else {
        homeIntegrationsService.unregister(homeItem.name);
        nextStepsService.register(nextStepItem);
      }
    });
  };

  var _setError = function(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  // TODO: FOR TESTING ONLY -- to be removed when server is functional
  // 
  var bitpayService__post = function(endpoint, json, cb) {
    // Simulate the POST.
    $log.debug('post: https://bitpay.com/api/v2/' + endpoint + ' data=' + JSON.stringify(json));
    //
    //
    var test_employers = [{
      data: {
        eid: 't1234567890',
        id: 't1234567890',
        name: 'T-Mobile USA Inc.',
        iconUrl: 'https://www.themagnificentmile.com/assets/Tourism-Operators/images/T-Mobile2.jpg',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/T-Mobile_logo2.svg/1280px-T-Mobile_logo2.svg.png',
        nextEffectiveDate: '01/02/2017',
        payCycle: 'weekly',
        about: {
          message: 'Welcome to T-Mobile bitcoin payroll!',
          terms: 'Terms of service',
          url: ''
        }
      },
      employeePool: [
        { id: 't0001', refId: 't-0000-0001', email: 'andy@t-mobile.com',    lastName: 'Phillipson', firstName: 'Andy'    },
        { id: 't0002', refId: 't-0000-0002', email: 'corey@t-mobile.com',   lastName: 'Glaze',      firstName: 'Corey'   },
        { id: 't0003', refId: 't-0000-0003', email: 'pieter@t-mobile.com',  lastName: 'Poothuis',   firstName: 'Pieter'  },
        { id: 't0004', refId: 't-0000-0004', email: 'charles@t-mobile.com', lastName: 'Roland',     firstName: 'Charles' }
      ]
    },
    {
      data: {
        eid: 'b1234567890',
        id: 'b1234567890',
        name: 'BitPay, Inc.',
        iconUrl: 'https://avatars2.githubusercontent.com/u/2554930?v=3&s=400',
        imageUrl: 'https://raw.githubusercontent.com/bitpay/bitpay-brand/master/bitpay-logo-full.png',
        nextEffectiveDate: new Date('01/02/2017'),
        about: {
          message: 'Welcome to BitPay bitcoin payroll!',
          terms: 'Terms of service',
          url: '#'
        }
      },
      employeePool: [
        { id: 'b0001', refId: 'b-0000-0001', email: 'andy@bitpay.com',    lastName: 'Phillipson', firstName: 'Andy'    },
        { id: 'b0002', refId: 'b-0000-0002', email: 'corey@bitpay.com',   lastName: 'Glaze',      firstName: 'Corey'   },
        { id: 'b0003', refId: 'b-0000-0003', email: 'pieter@bitpay.com',  lastName: 'Poothuis',   firstName: 'Pieter'  },
        { id: 'b0004', refId: 'b-0000-0004', email: 'charles@bitpay.com', lastName: 'Roland',     firstName: 'Charles' }
      ]
    },
    {
      data: {
        eid: 'i1234567890',
        id: 'i1234567890',
        name: 'IBM Corporation',
        iconUrl: 'http://www.myiconfinder.com/uploads/iconsets/4be5cdae8f0f7b1d9c011b27d82107c5-ibm.png',
        imageUrl: 'http://logodatabases.com/wp-content/uploads/2012/02/ibm-logo.jpg',
        nextEffectiveDate: new Date('01/02/2017'),
        about: {
          message: 'Welcome to IBM bitcoin payroll!',
          terms: 'Terms of service',
          url: '#'
        }
      },
      employeePool: [
        { id: 'i0001', refId: 'i-0000-0001', email: 'andy@ibm.com',    lastName: 'Phillipson', firstName: 'Andy'    },
        { id: 'i0002', refId: 'i-0000-0002', email: 'corey@ibm.com',   lastName: 'Glaze',      firstName: 'Corey'   },
        { id: 'i0003', refId: 'i-0000-0003', email: 'pieter@ibm.com',  lastName: 'Poothuis',   firstName: 'Pieter'  },
        { id: 'i0004', refId: 'i-0000-0004', email: 'charles@ibm.com', lastName: 'Roland',     firstName: 'Charles' }
      ]
    }];
    //
    // 
    var test_deductions = [{
      id: 't0001',
      active: true,
      address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
      amount: 10.50,
      currency: 'USD',
      //walletId: '13f68a06-4299-4ed6-8fe6-323298759b16',
      walletId: '4b4e6038-7325-4a71-b500-a2e1c5d80d64',
      externalWalletName: 'Andy\'s Paper Wallet',
      addressVerification: {
        verified: false,
        reason: 'unknown',
        accepted: true
      }
    }];
    //
    //
    var test_tx = {
      't0001': {
        transactionList: [
          {
            uniqueId: '1abcdefghij',
            timestamp: 'Fri Jan 13 2017 23:20:20 GMT-0500 (EST)',
            amount: '100',
            currency: 'USD',
            rate: '925.23',
            btc: '0.03456',
            status: 'PAID',
            address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
          },{
            uniqueId: '2abcdefghij',
            timestamp: 'Fri Jan 6 2017 23:20:20 GMT-0500 (EST)',
            amount: '150',
            currency: 'USD',
            rate: '825.23',
            btc: '0.02436',
            status: 'PAID',
            address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
          },{
            uniqueId: '3abcdefghij',
            timestamp: 'Fri Dec 29 2016 23:20:20 GMT-0500 (EST)',
            amount: '110',
            currency: 'USD',
            rate: '848.84',
            btc: '0.03831',
            status: 'PAID',
            address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
          },{
            uniqueId: '4abcdefghij',
            timestamp: 'Fri Dec 22 2016 23:20:20 GMT-0500 (EST)',
            amount: '200',
            currency: 'USD',
            rate: '925.23',
            btc: '0.03456',
            status: 'PAID',
            address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
          }
        ]
      }
    };
    //
    // Lookup record from API token
    // 
    var test_tokenMap = [
      { token: 'token-employer-t',  id: 't1234567890' },
      { token: 'token-employer-b',  id: 'b1234567890' },
      { token: 'token-employer-i',  id: 'i1234567890' },
      { token: 'token-employee-ap', id: 't0001' }
    ];

    //
    //
    //

    var params;
    if (json.params) {
      params = JSON.parse(json.params);
    }

    var res = {
      data: {}
    };

    switch (json.method) {
      case 'checkPayrollEligible':
        // PUBLIC facade
        // Does not return any id/eid/token -- informational repsonse only

        // Params
        var qualifyingData = params.qualifyingData;
        var account = params.account;
        
        var eligibilityRecord = {};
        var employer = lodash.find(test_employers, function(r) {
          var employee = lodash.find(r.employeePool, function(e) {
            return e.email == qualifyingData.email;
          });
          return (employee ? true : false);
        });

        if (employer) {
          eligibilityRecord = {
            email: qualifyingData.email,
            employer: employer.data,
            eligibility: {
              createDate: new Date(),
              verified: false,
              qualifyingData: {
                email: qualifyingData.email
              }
            }
          }
          res.data.error = null;
        } else {
          res.data.error = 'Employee not found';
        }
        res.data.data = eligibilityRecord;
        break;

      case 'getPayrollRecords':
        // PAYROLL-USER facade
        // Return a set of payroll records for the account; for testing we don't care what the account id is.
        // Returns id/eid/token

        // No params

        var records = [];

        // Hard code a test token.
        var token = 'token-employee-ap';
        var id = (lodash.find(test_tokenMap, function(m) {return m.token == token})).id;
        var employerRecord = lodash.find(test_employers, function(r) {
          var employee = lodash.find(r.employeePool, function(e) {
            return e.id == id;
          });
          return (employee ? true : false);
        });

        var employer = employerRecord.data;
        var employee = lodash.find(employerRecord.employeePool, function(e) {return e.id == id});
        var deduction = lodash.find(test_deductions, function(d) {return d.id == id});

        var record = {
          token: token,
          email: employee.email,
          eid: id,
          id: id,
          employer: employer,
          employee: employee,
          deduction: deduction
        };
        records.push(record);

        res.data.error = null;
        res.data.data = records;
        break;

      case 'getPayrollTransactions':
        // PAYROLL-USER facade

        // Params
        var id = params.recordId;
        var dateRange = params.dateRange;

        res.data.error = null;
        res.data.data = test_tx[id];
        break;

      case 'setPayrollRecord':
        // PAYROLL-USER facade
        // Is an update if an id/eid/token is provided (error if attrs not known).
        // Is a create if no id/eid/token is provided (not an error if employer has `n` records with same email).

        // Params
        var record = params.record;

        res.data.error = 'No server implementation';
        break;

      case 'deletePayrollRecord':
        // PAYROLL-USER facade

        // Params
        var id = params.recordId;

        res.data.error = 'No server implementation';
        break;
    }

    return cb(res);
  };
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  register();
  return root;

});
