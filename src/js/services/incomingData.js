'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $ionicModal, $state, $window, bitcore) {

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
      $state.go('send.confirm', {paypro: data})
    }


    data = sanitizeUri(data);

    // BIP21
    if (bitcore.URI.isValid(data)) {
      var parsed = new bitcore.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?  parsed.amount : '';

      if (parsed.r) {
        $state.go('send.confirm', {paypro: parsed.r});
      } else {
        if (amount) {
          $state.go('send.confirm', {toAmount: amount, toAddress: addr, description:message})
        } else {
          $state.go('send.amount', {toAddress: addr})
        }
      }
      return true;

    // Plain URL
    } else  if (/^https?:\/\//.test(data)) {
      return $state.go('send.confirm', {paypro: data})

    // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet')) {
      return $state.go('send.amount', {toAddress: data})
    } else if (bitcore.Address.isValid(data, 'testnet')) {
      return $state.go('send.amount', {toAddress: data})


    // Protocol
    } else if (data.indexOf($window.appConfig.name + '://glidera')==0) {
      return $state.go('uriglidera', {url: data})
    } else if (data.indexOf($window.appConfig.name + '://coinbase')==0) {
      return $state.go('uricoinbase', {url: data})

    // Join
    } else if (data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      return $state.go('add.join', {url: data})

    // Old join
    } else if (data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      return $state.go('add.join', {url: data})
    }


    return false;

  };

  return root;
});
