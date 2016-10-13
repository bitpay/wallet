'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $ionicModal, $state, $window, $timeout, bitcore, profileService, popupService, ongoingProcess, platformInfo, gettextCatalog) {

  var root = {};

  root.redir = function(data) {
    $log.debug('Processing incoming data:'  +data);

    function sanitizeUri(data) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(data);
      if (!match || match.length === 0) {
        return data;
      }
      var value = match[0].replace(',', '.');
      var newUri = data.replace(regex, value);

      // mobile devices, uris like copay://glidera
      newUri.replace('://', ':');

      return newUri;
    };

    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace('bitcoin:?r=', ''));
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', {paypro: data});
      }, 100);
      return true;
    }


    data = sanitizeUri(data);

    // BIP21
    if (bitcore.URI.isValid(data)) {
      var parsed = new bitcore.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?  parsed.amount : '';

      $state.go('tabs.send');
      $timeout(function() {
        if (parsed.r) {
          $state.transitionTo('tabs.send.confirm', {paypro: parsed.r});
        } else {
          if (amount) {
            $state.transitionTo('tabs.send.confirm', {toAmount: amount, toAddress: addr, description:message});
          } else {
            $state.transitionTo('tabs.send.amount', {toAddress: addr});
          }
        }
      }, 100);
      return true;

    // Plain URL
    } else if (/^https?:\/\//.test(data)) {
      console.log('in here brah');

      getPayProDetails(data, function(err, details) {
        if(err) {
          console.log('getPayProDetails err', err);
          return;
        }
        console.log('paypro details', details);
        $state.go('tabs.send');
        $timeout(function() {
          $state.transitionTo('tabs.send.confirm', {paypro: data});
        }, 100);
        return true;
      });
    // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet')) {
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.amount', {toAddress: data});
      }, 100);
      return true;
    } else if (bitcore.Address.isValid(data, 'testnet')) {
      $state.go('tabs.send');
      $timeout(function() {
        $state.transitionTo('tabs.send.amount', {toAddress: data});
      }, 100);
      return true;

    // Protocol
    } else if (data && data.indexOf($window.appConfig.name + '://glidera')==0) {
      return $state.go('uriglidera', {url: data});
    } else if (data && data.indexOf($window.appConfig.name + '://coinbase')==0) {
      return $state.go('uricoinbase', {url: data});

    // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      }, 100);
      return true;

    // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home');
      $timeout(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      }, 100);
      return true;
    }

    return false;

  };

  function getPayProDetails(uri, cb) {
    if (!cb) cb = function() {};

    var wallet = profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (platformInfo.isChromeApp) {
      popupService.showAlert(gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      return cb(true);
    }

    $log.debug('Fetch PayPro Request...', uri);

    ongoingProcess.set('fetchingPayPro', true);
    //debugger;
    // uri = 'https://bitpay.com/i/NhjqGZo1RNoHxiHxK7VBuM';
    // uri = 'https://test.bitpay.com:443/i/LCy5Y7hxmEbkprAK27odAU';
    wallet.fetchPayPro({
      payProUrl: uri,
    }, function(err, paypro) {
      console.log('paypro', paypro);
      ongoingProcess.set('fetchingPayPro', false);

      if (err) {
        $log.warn('Could not fetch payment request:', err);
        var msg = err.toString();
        if (msg.match('HTTP')) {
          msg = gettextCatalog.getString('Could not fetch payment information');
        }
        popupService.showAlert(msg);
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        popupService.showAlert(gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }

      // $scope.toAmount = paypro.amount;
      // $scope.toAddress = paypro.toAddress;
      // $scope.description = paypro.memo;
      // $scope.paypro = null;
      //
      // $scope._paypro = paypro;

      //return initConfirm();
      cb(null, paypro);
    });
  };

  return root;
});
