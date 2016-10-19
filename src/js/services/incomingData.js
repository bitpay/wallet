'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $state, $window, $timeout, bitcore, profileService, popupService, ongoingProcess, platformInfo, gettextCatalog, $rootScope) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data) {
    $log.debug('Processing incoming data: ' + data);

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
    }

    function getParameterByName(name, url) {
      if (!url) return;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace('bitcoin:?r=', ''));
      $state.go('tabs.send').then(function() {
        $state.transitionTo('tabs.send.confirm', {paypro: data});
      });
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
      // Timeout is required to enable the "Back" button
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
      });
      return true;

    // Plain URL
    } else if (/^https?:\/\//.test(data)) {

      getPayProDetails(data, function(err, details) {
        if(err) {
          root.showMenu({data: data, type: 'url'});
          return;
        }
        $state.go('tabs.send');
        var stateParams = {
          toAmount: details.amount,
          toAddress: details.toAddress,
          description: details.memo,
          paypro: details
        };
        $state.transitionTo('tabs.send.confirm', stateParams);
        return true;
      });
    // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet')) {
      root.showMenu({data: data, type: 'bitcoinAddress'});
    } else if (bitcore.Address.isValid(data, 'testnet')) {
      root.showMenu({data: data, type: 'bitcoinAddress'});
    // Protocol
  } else if (data && data.indexOf($window.appConfig.name + '://glidera') === 0) {
      return $state.go('uriglidera', {url: data});
    } else if (data && data.indexOf($window.appConfig.name + '://coinbase') === 0) {
      return $state.go('uricoinbase', {url: data});

    // BitPayCard Authentication
  } else if (data && data.indexOf($window.appConfig.name + '://') === 0) {
      var secret = getParameterByName('secret', data);
      var email = getParameterByName('email', data);
      var otp = getParameterByName('otp', data);
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.bitpayCardIntro', {
          secret: secret,
          email: email,
          otp: otp
        });
      });
      return true;

    // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      });
      return true;

    // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.join', {url: data});
      });
      return true;
    } else {
      root.showMenu({data: data, type: 'text'});
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

    wallet.fetchPayPro({
      payProUrl: uri,
    }, function(err, paypro) {

      ongoingProcess.set('fetchingPayPro', false);
      if (err) {
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        popupService.showAlert(gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }
      cb(null, paypro);

    });
  }

  return root;
});
