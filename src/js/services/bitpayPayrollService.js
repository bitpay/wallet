'use strict';

angular.module('copayApp.services').factory('bitpayPayrollService', function($log, lodash, configService, storageService, bitpayService, bwcService, profileService, gettextCatalog) {

  var root = {};

  var ADDRESS_NOT_VERIFIED_RECOMMENDATION  = gettextCatalog.getString('If you cannot manually verify that your deposit address is correct then you should change your deposit wallet/address immediately.');
  var ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_NOT_IN_WALLET   = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The address is not associated with the specified wallet.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL = gettextCatalog.getString('We are unable to verify this deposit address.<br/><br/>The specified address does not belong to any wallet in this app.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);
  var ADDRESS_VERIFIED                     = gettextCatalog.getString('This deposit address was verified automatically to be owned by you and associated with the specified wallet.');
  var ADDRESS_VERIFIED_MANUALLY            = gettextCatalog.getString('This deposit address was manually verified by you to be correct.<br/><br/>' + ADDRESS_NOT_VERIFIED_RECOMMENDATION);

  // During payroll setup the bitpayAccount defines the environment for submission of payroll records.
  var bitpayAccount = undefined;

  root.bindToBitPayAccount = function(account) {
    bitpayAccount = account;
  };

  // qualifyingData: {
  //   email: string
  // }
  // 
  // Returns a payroll record with eligibility info or null if not eligible.
  // 
  // record: {
  //   token: string
  //   eid: string
  //   id: string
  //   eligibility: {
  //     createDate: date
  //     qualifyingData: {
  //       email: string
  //     }
  //     employer: {
  //       eid: string
  //       id: string
  //       name: string
  //       iconUrl: string 
  //       imageUrl: string 
  //     }
  //   }
  root.checkIfEligible = function(qualifyingData, cb) {
    var json = {
      method: 'checkPayrollEligible',
      params: JSON.stringify(qualifyingData)
    };
    bitpayService.post(bitpayAccount.apiContext.token, json, function(data) {
      //////////////////////////////////////////////////////////////////////
      //
      // FOR TESTING
      // 
      var testRecords = [{
        token: 't1234567890',
        eid: 't1234567890',
        id: 't1234567890',
        employer: {
          eid: 't1234567890',
          id: 't1234567890',
          name: 'T-Mobile USA Inc.',
          iconUrl: 'https://www.themagnificentmile.com/assets/Tourism-Operators/images/T-Mobile2.jpg',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/T-Mobile_logo2.svg/1280px-T-Mobile_logo2.svg.png',
          nextEffectiveDate: '01/02/2017',
          payCycle: 'weekly',
          message: {
            text: 'Welcome to T-Mobile bitcoin payroll!',
            background: '#ec34a2',
            color: 'white'
          }
        },
        eligibility: {
          createDate: new Date(),
          verified: false,
          qualifyingData: {
            email: 'andy@t-mobile.com'
          }
        }
      },
      {
        token: 'b1234567890',
        eid: 'b1234567890',
        id: 'b1234567890',
        employer: {
          eid: 'b1234567890',
          id: 'b1234567890',
          name: 'BitPay, Inc.',
          iconUrl: 'https://avatars2.githubusercontent.com/u/2554930?v=3&s=400',
          imageUrl: 'https://raw.githubusercontent.com/bitpay/bitpay-brand/master/bitpay-logo-full.png',
          nextEffectiveDate: new Date('01/02/2017'),
          message: {
            text: 'Welcome to BitPay bitcoin payroll!',
            background: '#1e3186',
            color: 'white'
          }
        },
        eligibility: {
          createDate: new Date(),
          verified: false,
          qualifyingData: {
            email: 'andy@bitpay.com'
          }
        }
      },
      {
        token: 'i1234567890',
        eid: 'i1234567890',
        id: 'i1234567890',
        employer: {
          eid: 'i1234567890',
          id: 'i1234567890',
          name: 'IBM Corporation',
          iconUrl: 'http://www.myiconfinder.com/uploads/iconsets/4be5cdae8f0f7b1d9c011b27d82107c5-ibm.png',
          imageUrl: 'http://logodatabases.com/wp-content/uploads/2012/02/ibm-logo.jpg',
          nextEffectiveDate: new Date('01/02/2017'),
          message: {
            text: 'Welcome to IBM bitcoin payroll!',
            background: 'lightblue',
            color: 'white'
          }
        },
        eligibility: {
          createDate: new Date(),
          verified: false,
          qualifyingData: {
            email: 'andy@ibm.com'
          }
        }
      }];
      data.data.error = null;
      data.data.data = lodash.find(testRecords, function(r) {return r.eligibility.qualifyingData.email == qualifyingData.email});
      //
      //////////////////////////////////////////////////////////////////////
      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Check Payroll Eligible: SUCCESS');
      var record = data.data.data;

      // If eligible then re-fetch and cache all payroll records (a new payroll record may have been created).
      if (record && record.eligibility) {
        root.fetchPayrollRecords(bitpayAccount.apiContext, function(err, records) {
          if (err) return cb(err);
          var createdRecord = lodash.find(records, function(r) {
            return r.eid == record.eid;
          });

          if (!createdRecord) {
            return cb(_setError('Could not find payroll record after server create: ' + record.eid));
          }
          return cb(null, createdRecord);
        });
      } else {
        return cb(null, null);
      }
    }, function(data) {
      return cb(_setError('BitPay Account Error: Check Payroll Eligible', data));
    });
  };

  // record: {
  //   token: record token,
  //   email: account email,
  //   eid: record id,
  //   id: record id,
  //   employer: {
  //     eid: employer id,
  //     id: employer id,
  //     name,
  //     iconUrl,
  //     imageUrl,
  //     nextEffectiveDate,
  //     payCycle
  //   },
  //   employee: {
  //     label,
  //     email
  //   },
  //   deduction: {
  //     active,
  //     address,
  //     walletId,
  //     amount,
  //     currency,
  //     externalWalletName,
  //     unverifiedAddressAccepted
  //   }
  // }
  root.startPayroll = function(record, cb) {
    // Delete the eligibility record when we start.
    delete record.eligibility;
    record.deduction.active = true;
    record.deduction.unverifiedAddressAccepted = false;
    root.updatePayroll(record, cb);
  };

  root.pausePayroll = function(record, cb) {
    record.deduction.active = false;
    root.updatePayroll(record, cb);
  };

  root.stopPayroll = function(record, cb) {
    if (!record || !record.eid) {
      return cb(_setError('Error stopping payroll: payroll record malformed'));
    }
    deletePayrollRecord(record, cb);
  };

  root.manuallyVerifyAddress = function(record, cb) {
    record.deduction.unverifiedAddressAccepted = true;
    root.updatePayroll(record, cb);
  };

  root.updatePayroll = function(record, cb) {
    if (!record || !record.eid) {
      return cb(_setError('Error updating payroll: payroll record malformed'));
    }
    postPayrollRecord(record, cb);
  };

  // Return payroll records from local cache. Looks across all paired accounts.
  root.getPayrollRecords = function(cb) {
    storageService.getPayrollRecords(bitpayService.getEnvironment().network, function(err, records) {
      if (err) return cb(err);
      return cb(null, records || []);
    });
  };

  root.removePayrollRecord = function(record, cb) {
    storageService.removePayrollRecord(bitpayService.getEnvironment().network, record, function(err) {
      if (err) {
        $log.error('Error removing payroll record: ' + err);
      }
      // If there are no more cards in storage then re-enable the next step entry
      storageService.getPayrollRecords(bitpayService.getEnvironment().network, function(err, records) {
        if (err) {
          $log.error('Error getting payroll records after remove: ' + err);
          // Continue, try to remove next step if necessary
        }
        if (records.length == 0) {
          storageService.removeNextStep('Payroll', function() {});
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
    bitpayService.post(apiContext.token, json, function(data) {
      //////////////////////////////////////////////////////////////////////
      //
      // FOR TESTING
      // 
      var testRecords = [{
        token: 't1234567890',
        eid: 't1234567890',
        id: 't1234567890',
        employer: {
          eid: 't1234567890',
          id: 't1234567890',
          name: 'T-Mobile USA Inc.',
          iconUrl: 'https://www.themagnificentmile.com/assets/Tourism-Operators/images/T-Mobile2.jpg',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/T-Mobile_logo2.svg/1280px-T-Mobile_logo2.svg.png',
          nextEffectiveDate: new Date('01/02/2017'),
          payCycle: 'weekly',
          about: {
            html:
              '<p class="about__heading">TERMS OF SERVICE</p>' +
              '<p>Welcome to <b>T-Mobile</b> bitcoin payroll!</p>'+
              '<p><a href="https://www.t-mobile.com">Terms of Service</a></p>'
          }
        },
        employee: {
          label: '',
          email: 'andy@t-mobile.com',
          firstName: 'Andy',
          lastName: 'Phillipson'
        },
        deduction: {
          active: true,
          address: '1ApLN1BJw2DUZ17ofH9xq59P7Jc9vMGSYe',
          amount: 10.50,
          currency: 'USD',
          //walletId: '13f68a06-4299-4ed6-8fe6-323298759b16',
          walletId: '4b4e6038-7325-4a71-b500-a2e1c5d80d64',
          externalWalletName: 'Andy\'s Paper Wallet',
          unverifiedAddressAccepted: true
        }
      },
      {
        token: 'b1234567890',
        eid: 'b1234567890',
        id: 'b1234567890',
        employer: {
          eid: 'b1234567890',
          id: 'b1234567890',
          name: 'BitPay, Inc.',
          iconUrl: 'https://avatars2.githubusercontent.com/u/2554930?v=3&s=400',
          imageUrl: 'https://raw.githubusercontent.com/bitpay/bitpay-brand/master/bitpay-logo-full.png',
          nextEffectiveDate: new Date('01/02/2017'),
          about: {
            html:
              '<p class="about__heading">TERMS OF SERVICE</p>' +
              '<p>Welcome to <b>BitPay</b> bitcoin payroll!</p>'+
              '<p><a href="https://bitpay.com">Terms of Service</a></p>'
          }
        },
        employee: {
          label: '',
          email: 'andy@bitpay.com',
          firstName: 'Andy',
          lastName: 'Phillipson'
        },
      },
      {
        token: 'i1234567890',
        eid: 'i1234567890',
        id: 'i1234567890',
        employer: {
          eid: 'i1234567890',
          id: 'i1234567890',
          name: 'IBM Corporation',
          iconUrl: 'http://www.myiconfinder.com/uploads/iconsets/4be5cdae8f0f7b1d9c011b27d82107c5-ibm.png',
          imageUrl: 'http://logodatabases.com/wp-content/uploads/2012/02/ibm-logo.jpg',
          nextEffectiveDate: new Date('01/02/2017'),
          about: {
            html:
              '<p class="about__heading">TERMS OF SERVICE</p>' +
              '<p>Welcome to <b>IBM</b> bitcoin payroll!</p>'+
              '<p><a href="https://www.ibm.com">Terms of Service</a></p>'
          }
        },
        eligibility: {
          createDate: new Date(),
          verified: false,
          qualifyingData: {
            email: 'andy@ibm.com'
          }
        }
      }];
      data.data.error = null;
      data.data.data = testRecords;
      //
      //////////////////////////////////////////////////////////////////////

      if (data && data.data.error) return cb(data.data.error);
      $log.info('BitPay Account Get Payroll Records: SUCCESS');
      // Cache payroll records in storage.
      var records = data.data.data;

      checkAddress(records, function(err, records) {
        if (err) return cb(err);
        cachePayrollRecords(records, apiContext, function(err) {
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

  root.fetchPayrollRecordHistory = function(recordId, dateRange, cb) {
    var json = {
      method: 'getPayrollTransactions',
      params: JSON.stringify({
        recordId: recordId,
        dateRange: dateRange
      })
    };
    // Get payroll transactions
    bitpayService.post(bitpayAccount.apiContext.token, json, function(data) {
      //////////////////////////////////////////////////////////////////////
      //
      // FOR TESTING
      // 
      var testData = {
        't1234567890': {
          transactions: [{
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
          }]
        }
      };
      data.data.error = null;
      data.data.data = testData;
      //
      //////////////////////////////////////////////////////////////////////

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

  var cachePayrollRecords = function(records, apiContext, cb) {
    var data = {
      token: apiContext.token,
      email: apiContext.pairData.email,
      records: records,
    };
    storageService.setPayrollRecords(bitpayService.getEnvironment().network, data, function(err) {
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
              $log.warn('Payroll deposit address not in specified wallet. address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            } else {
              // The specified address is not in the wallet we found.
              $records[i].deduction.addressVerification = {
                verified: false,
                message: ADDRESS_NOT_VERIFIED_NOT_IN_WALLET
              };
              $log.warn('Payroll deposit address not in specified wallet. address: ' + records[i].deduction.address + ',  wallet: ' + records[i].deduction.walletId);
            }
          } else {
            // No wallet found locally for a specified wallet id.
            records[i].deduction.addressVerification = {
              verified: false,
              message: ADDRESS_NOT_VERIFIED_WALLET_EXTERNAL
            };
            $log.warn('Payroll deposit wallet is external. walletId: ' + records[i].deduction.walletId + ' address: ' + records[i].deduction.address);
          }
        } else {
          // User provided an address only, not a wallet.
          records[i].deduction.addressVerification = {
            verified: false,
            message: ADDRESS_NOT_VERIFIED_ADDRESS_UNKNOWN
          };
          $log.warn('Payroll deposit address could not be verified. address:' + records[i].deduction.address);
        }

        if (records[i].deduction.unverifiedAddressAccepted) {
          records[i].deduction.addressVerification = {
            verified: true,
            message: ADDRESS_VERIFIED_MANUALLY
          };
          $log.info('User previously accepted unverified payroll address. address: ' + records[i].deduction.address);
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

    bitpayService.post(bitpayAccount.apiContext.token, json, function(data) {
      //////////////////////////////////////////////////////////////////////
      //
      // FOR TESTING
      // 
      data.data.error = null;
      //
      //////////////////////////////////////////////////////////////////////
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

    bitpayService.post(bitpayAccount.apiContext.token, json, function(data) {
      //////////////////////////////////////////////////////////////////////
      //
      // FOR TESTING
      // 
      data.data.error = null;
      //
      //////////////////////////////////////////////////////////////////////
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

  var _setError = function(msg, e) {
    $log.error(msg);
    var error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

  return root;

});
