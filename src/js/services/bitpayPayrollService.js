'use strict';
angular.module('copayApp.services').factory('bitpayPayrollService', function($log, lodash, configService, storageService, bitpayService, bwcService, profileService, walletService, gettextCatalog, homeIntegrationsService, nextStepsService) {

  var root = {};

  var ADDRESS_NOT_VERIFIED_RECOMMENDATION  = gettextCatalog.getString('If you cannot manually verify that your deposit address is correct then you should change your deposit wallet/address immediately.');
  var ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN = gettextCatalog.getString('We are unable to verify this deposit address. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_NOT_IN_WALLET   = gettextCatalog.getString('We are unable to verify this deposit address. The address is not associated with the specified wallet. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL = gettextCatalog.getString('We are unable to verify this deposit address. The specified address does not belong to any wallet in this app. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_VERIFIED                     = gettextCatalog.getString('This deposit address was verified automatically to be owned by you and associated with the specified wallet.');
  var ADDRESS_VERIFIED_MANUALLY            = gettextCatalog.getString('This deposit address was manually verified by you to be correct. ' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);

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

    var json = {
      method: 'checkPayrollEligible',
      params: JSON.stringify(qualifyingData)
    };

    bitpayService__post('', json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Check Payroll Eligible: SUCCESS');
      var record = data.data.data;

      if (record && record.eligibility) {
        // If there is an account context then fetch any payroll records created on the account.
        if (bitpayAccount) {
          root.fetchPayrollRecords(bitpayAccount.apiContext, function(err, records) {
            if (err) return cb(err);
/*
            var createdRecord = lodash.find(records, function(r) {
              return r.eid == record.eid;
            });

            if (!createdRecord) {
              return cb(_setError('Could not find payroll record after server create: ' + record.eid));
            }
            registerAndCallback(null, createdRecord);
*/
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
  //     unverifiedAddressAccepted: boolean
  //   }
  // }
  root.startPayroll = function(record, cb) {
    // Delete the eligibility data when we start.
    delete record.eligibility;
    record.deduction.active = true;
    record.deduction.unverifiedAddressAccepted = false;

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
      deletePayrollRecord(record, function(err) {
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
    if (!record || !record.eid) {
      return cb(_setError('Error updating payroll: payroll record malformed'));
    }
    postPayrollRecord(record, cb);
  };

  root.manuallyVerifyAddress = function(record, cb) {
    record.deduction.unverifiedAddressAccepted = true;
    root.updatePayroll(record, cb);
  };

  // Return payroll records from local cache. Looks across all paired accounts, includes eligibility records.
  root.getPayrollRecords = function(cb) {
    storageService.getPayrollRecords(bitpayService.getEnvironment().network, function(err, pRecords) {
      if (err) return cb(err);
      storageService.getPayrollEligibilityRecords(bitpayService.getEnvironment().network, function(err, eRecords) {
        if (err) return cb(err);
        return cb(null, eRecords.concat(pRecords) || []);
      });
    });
  };

  root.getPayrollRecordById = function(id, cb) {
    root.getPayrollRecords(function(err, records) {
      if (err) return cb(err);
      var record = lodash.find(records, function(r) {
        return r.id == id;
      });
      cb(null, record);
    });
  };

  root.removePayrollRecord = function(id, cb) {
    storageService.removePayrollRecord(bitpayService.getEnvironment().network, id, function(err) {
      if (err) {
        $log.error('Error removing payroll record: ' + err);
      }
      // If there are no more cards in storage then re-enable the next step entry
        root.getPayrollRecords(function(err, records) {
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

  // Retrieve payroll records from the server and cache locally.
  root.fetchPayrollRecords = function(apiContext, cb) {
    var json = {
      method: 'getPayrollRecords'
    };
    // Get payroll records
    bitpayService__post(apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
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

  root.getPayrollRecordHistory = function(recordId, cb) {
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

  root.setPayrollRecordHistory = function(recordId, data, opts, cb) {
    storageService.getPayrollRecordsHistory(bitpayService.getEnvironment().network, function(err, oldData) {
      if (lodash.isString(oldData)) {
        oldData = JSON.parse(oldData);
      }
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      var hist = oldData || {};
      hist[recordId] = data;
      if (opts && opts.remove) {
        delete(hist[recordId]);
      }
      storageService.setPayrollRecordsHistory(bitpayService.getEnvironment().network, hist, function(err) {
        return cb(err);
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
  root.fetchPayrollRecordHistory = function(recordId, dateRange, cb) {
    var json = {
      method: 'getPayrollTransactions',
      params: JSON.stringify({
        recordId: recordId,
        dateRange: dateRange
      })
    };
    // Get payroll transactions
    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
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
      data[recordId] = txData[recordId].transactions;
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
            // var addressObj = bwcService.getClient().getAddressFromWallet(records[i].deduction.walletId, address);
            var addressObj = {};

            if (addressObj) {
              records[i].deduction.addressVerification = {
                verified: true,
                message: ADDRESS_VERIFIED
              };
              $log.warn('Payroll deposit address not in specified wallet; address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            } else {
              // The specified address is not in the wallet we found.
              $records[i].deduction.addressVerification = {
                verified: false,
                message: ADDRESS_NOT_VERIFIED_NOT_IN_WALLET
              };
              $log.warn('Payroll deposit address not in specified wallet; address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            }
          } else {
            // No wallet found locally for a specified wallet id.
            records[i].deduction.addressVerification = {
              verified: false,
              message: ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL
            };
            $log.warn('Payroll deposit wallet is external; walletId: ' + records[i].deduction.walletId + ' address: ' + records[i].deduction.address);
          }
        } else {
          // User provided an address only, not a wallet.
          records[i].deduction.addressVerification = {
            verified: false,
            message: ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN
          };
          $log.warn('Payroll deposit address could not be verified:' + records[i].deduction.address);
        }

        if (records[i].deduction.unverifiedAddressAccepted) {
          records[i].deduction.addressVerification = {
            verified: true,
            message: ADDRESS_VERIFIED_MANUALLY
          };
          $log.info('User previously accepted unverified payroll address: ' + records[i].deduction.address);
        }
      }
    }
    cb(null, records);
  };

  var postPayrollRecord = function(record, cb) {
    var json = {
      method: 'setPayrollRecord',
      params: JSON.stringify(record)
    };
    $log.debug('Posting payroll: ' + json.params);

    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Set Payroll Record: SUCCESS');

      // Re-cache payroll records after the server updates.
      root.fetchPayrollRecords(bitpayAccount.apiContext, function(err, records) {
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

  var deletePayrollRecord = function(record, cb) {
    var json = {
      method: 'deletePayrollRecord',
      params: JSON.stringify(record)
    };
    $log.debug('Deleting payroll: ' + json.params);

    bitpayService__post(bitpayAccount.apiContext.token, json, function(data) { // TODO
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Delete Payroll Record: SUCCESS');

      // Re-cache payroll records after the server updates.
      root.fetchPayrollRecords(bitpayAccount.apiContext, function(err, records) {
        return cb(err);
      });
    }, function(data) {
      return cb(_setError('BitPay Account Error: Delete Payroll Record', data));
    });
  };

  var register = function() {
    root.getPayrollRecords(function(err, records) {
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
  var bitpayService__post = function(token, json, cb) {
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
      unverifiedAddressAccepted: true
    }];
    //
    //
    var test_tx = {
      't0001': {
        transactions: [
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

    var res = {
      data: {}
    };

    switch (json.method) {
      // PUBLIC facade
      case 'checkPayrollEligible':
        var qualifyingData = JSON.parse(json.params);
        var eligibilityRecord = {};
        var employer = lodash.find(test_employers, function(r) {
          var employee = lodash.find(r.employeePool, function(e) {
            return e.email == qualifyingData.email;
          });
          return (employee ? true : false);
        });

        if (employer) {
          var ts = Date.now();
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

      // PAYROLL-USER facade
      case 'getPayrollRecords':
        // Return a set of payroll records for the account; for testing we don't care what the account id is.
        var records = [];

        // Hard code a test token.
        token = 'token-employee-ap';
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

      // PAYROLL-USER facade
      case 'getPayrollTransactions':
        res.data.error = null;
        res.data.data = test_tx;
        break;

      // PAYROLL-USER facade
      case 'setPayrollRecord':
        res.data.error = 'No server implementation';
        break;

      // PAYROLL-USER facade
      case 'deletePayrollRecord':
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
