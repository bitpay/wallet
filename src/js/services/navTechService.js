'use strict';
/*
  This class lets interfaces with a NavTech Server's API.
*/

var NavTechService = function(opts) {
  var self = this;

  opts = opts || {};
  self.$log = opts.$log
  self.httprequest = opts.httprequest; // || request;
  self.lodash = opts.lodash;
  self.storageService = opts.storageService;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';

  self._isAvailable = false;
  self._queued = [];

  self.delay = 20;
  self.encryptionLength = 344;

  self.jsencrypt = new JSEncrypt();

  // self.availableServers = [
  //   'navtech1.navcoin.org:3000',
  //   'navtech2.navcoin.org:3000',
  //   'navtech3.navcoin.org:3000',
  //   'navtech4.navcoin.org:3000'
  // ]
  self.availableServers = []
};


var _navtechInstance;
NavTechService.singleton = function(opts) {
  if (!_navtechInstance) {
    _navtechInstance = new NavTechService(opts);
  }
  return _navtechInstance;
};

NavTechService.prototype._checkNode = function(availableServers, numAddresses, callback) {
  var self = this;

  self.getNavTechServers(function(error, servers) {
    self.availableServers = servers;

    if (!self.availableServers || self.availableServers.length === 0) {
      self.runtime.callback(false, { message: 'No valid NavTech servers found' });
      return;
    }

    var randomIndex = Math.floor(Math.random() * availableServers.length)
    var navtechServerUrl = 'https://' + availableServers[randomIndex] + '/api/check-node';

    var retrieve = function() {
      // self.$log.debug('Fetching navtech server data');
      self.httprequest.post(navtechServerUrl, { num_addresses: numAddresses }).success(function(res){
        if(res && res.type === 'SUCCESS' && res.data) {
          // self.$log.debug('Success fetching navtech data from server ' + availableServers[randomIndex], res);
          //@TODO check if amount is larger than server max amount
          self.runtime.serverInfo = {
            maxAmount: res.data.max_amount,
            minAmount: res.data.min_amount,
            navtechFeePercent: res.data.transaction_fee,
          }

          callback(res.data, self, 0);
        } else {
          // self.$log.debug('Bad response from navtech server ' + availableServers[randomIndex], res);
          availableServers.splice(randomIndex, 1);
          self._checkNode(availableServers, numAddresses, callback);
        }
      }).error(function(err) {
        // self.$log.debug('Error fetching navtech server data', err);
        availableServers.splice(randomIndex, 1);
        self._checkNode(availableServers, numAddresses, callback);
      });

    };

    retrieve();
  })
};

NavTechService.prototype._splitPayment = function(navtechData, self) {

  var amount = Math.ceil(self.runtime.amount / (1 - (parseFloat(navtechData.transaction_fee) / 100)));

  var max = 6;
  var min = 2;
  var numTxes = Math.floor(Math.random() * (max - min + 1)) + min;
  var runningTotal = 0;
  var rangeMiddle = amount / numTxes;
  var rangeTop = Math.floor(rangeMiddle * 1.5);
  var rangeBottom = Math.floor(rangeMiddle * 0.5);
  var amounts = [amount];

  self.runtime.amounts = amounts;
  self._encryptTransactions(navtechData, self, 0);

  return;

  for (var i = 0; i < numTxes; i++) {
    if (runningTotal < amount) {
      var randSatoshis = Math.floor(Math.random() * (rangeTop - rangeBottom) + rangeBottom);
      if (randSatoshis > amount - runningTotal || i === numTxes - 1) {
        var remainingAmount = Math.round(amount - runningTotal);
        amounts.push(remainingAmount);
        runningTotal += remainingAmount;
      } else {
        amounts.push(randSatoshis);
        runningTotal += randSatoshis
      }
    }
  }

  if (runningTotal === amount && amounts.length > 1) {
    self.runtime.amounts = amounts;
    self._encryptTransactions(navtechData, self, 0);
  } else {
    // self.$log.debug('Failed to split payment');
    self.runtime.callback(false, { message: 'Failed to split payment' });
    return false;
  }
}

NavTechService.prototype._encryptTransactions = function(navtechData, self, counter) {
  var payments = [];
  var numPayments = self.runtime.amounts.length;

  for(var i=0; i<numPayments; i++) {
    var payment = self.runtime.amounts[i];
    try {
      var timestamp = new Date().getUTCMilliseconds();
      var dataToEncrypt = {
        n: self.runtime.address,
        t: self.delay,
        p: i+1,
        o: numPayments,
        u: timestamp,
      }

      self.jsencrypt.setPublicKey(navtechData.public_key);

      var encrypted = self.jsencrypt.encrypt(JSON.stringify(dataToEncrypt));

      if (encrypted.length !== self.encryptionLength && counter < 10) {
        // self.$log.debug('Failed to encrypt the payment data... retrying', counter, encrypted.length, encrypted);
        self._encryptTransactions(navtechData, self, counter++);
        return;
      } else if(encrypted.length !== self.encryptionLength && counter >= 10){
        // self.$log.debug('Failed to encrypt the payment data... exiting', counter, encrypted.length, encrypted);
        self.runtime.callback(false, { message: 'Failed to encrypt the payment data' });
        return;
      }

      payments.push({
        amount: self.runtime.amounts[i],
        address: navtechData.nav_addresses[i],
        anonDestination: encrypted
      });
    } catch (err) {
      // self.$log.debug('Threw error encrypting the payment data', err);
      self.runtime.callback(false, { message: 'Threw error encrypting the payment data' });
      return;
    }
  }
  self.runtime.callback(true, payments, self.runtime.serverInfo);
}

NavTechService.prototype.findNode = function(amount, address, callback) {
  if (!amount || !address) {
    callback(false, { message: 'invalid params' });
    return;
  }

  if (amount < 5 * 1e8) { //@TODO move this to the server response.
    callback(false, { message: 'Amount is too small, minimum is 5 NAV' });
    return;
  }

  if(amount > 10000 * 1e8) { //@TODO move this to the server response.
    callback(false, { message: 'Amount is too large, maximum is 10,000 NAV' });
    return;
  }

  var self = this;
  self.runtime = {};
  self.runtime.callback = callback;
  self.runtime.address = address;
  self.runtime.amount = amount;
  self._checkNode(self.availableServers, 6, self._splitPayment);
}

NavTechService.prototype.addNode = function(newServer, callback) {
  var self = this;

  self.getNavTechServers(function(error, servers) {
    self.availableServers = servers;
    self.availableServers.push(newServer);

    self.storageService.setNavTechServers(self.availableServers, function(error) {
      if (error) { return callback(error) }
      self.$log.debug('Added new NavTech Server:' + newServer, self.availableServers)

      callback(false,  self.availableServers)
    })
  })
}

NavTechService.prototype.getNavTechServers = function(callback) {
  var self = this;
  if (self.availableServers.length !== 0) {
    callback(false, self.availableServers)
  } else {
    self.storageService.getNavTechServers(function(error, servers) {
      if (error) { callback(error) }
      if (servers) { self.availableServers = JSON.parse(servers) }

      callback(false, self.availableServers)
    })
  }
}

angular.module('copayApp.services').factory('navTechService', function($http, lodash, $log, storageService) {
  var cfg = {
    httprequest: $http,
    lodash: lodash,
    $log: $log,
    storageService: storageService,
  };

  return NavTechService.singleton(cfg)
});
