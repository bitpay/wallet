'use strict';

angular.module('copayApp.services').factory('incomingData', function($log, $state, $timeout, $ionicHistory, bitcore, $rootScope, payproService, scannerService, appConfigService, popupService, gettextCatalog) {

  var root = {};

  root.showMenu = function(data) {
    $rootScope.$broadcast('incomingDataMenu.showMenu', data);
  };

  root.redir = function(data, privatePayment, stopRedirect) {
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

    function checkPrivateKey(privateKey) {
      try {
        new bitcore.PrivateKey(privateKey, 'livenet');
      } catch (err) {
        return false;
      }
      return true;
    }

    function goSend(addr, amount, message) {
      $state.go('tabs.send', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.send' ? false : true
      });
      // Timeout is required to enable the "Back" button
      $timeout(function() {
        if (amount) {
          $state.transitionTo('tabs.send.confirm', {
            toAmount: amount,
            toAddress: addr,
            description: message
          });
        } else {
          $state.transitionTo('tabs.send.amount', {
            toAddress: addr,
            privatePayment: privatePayment,
          });
        }
      }, 100);
    }
    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace('bitcoin:?r=', ''));
      $state.go('tabs.send', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.send' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.send.confirm', {
          paypro: data
        });
      });
      return true;
    }

    data = sanitizeUri(data);

    // BIP21
    if (bitcore.URI.isValid(data)) {
      var parsed = new bitcore.URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ? parsed.amount : '';

      if (parsed.r) {
        payproService.getPayProDetails(parsed.r, function(err, details) {
          if (err) {
            if (addr && amount) goSend(addr, amount, message);
            else popupService.showAlert(gettextCatalog.getString('Error'), err);
          } else handlePayPro(details);
        });
      } else {
        goSend(addr, amount, message);
      }
      return true;

      // Plain URL
    } else if (/^https?:\/\//.test(data)) {

      payproService.getPayProDetails(data, function(err, details) {
        if (err) {
          root.showMenu({
            data: data,
            type: 'url'
          });
          return;
        }
        handlePayPro(details);
        return true;
      });
      // Plain Address
    } else if (bitcore.Address.isValid(data, 'livenet') || bitcore.Address.isValid(data, 'testnet')) {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'bitcoinAddress'
        });
      } else {
        if (!stopRedirect) {
          goToAmountPage(data, privatePayment);
          return false;
        } else {
          return true;
        }
      }
    } else if (data && data.indexOf(appConfigService.name + '://glidera') === 0) {
      var code = getParameterByName('code', data);
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $state.transitionTo('tabs.buyandsell.glidera', {
          code: code
        });
      });
      return true;

    } else if (data && data.indexOf(appConfigService.name + '://coinbase') === 0) {
      var code = getParameterByName('code', data);
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $ionicHistory.nextViewOptions({
          disableAnimate: true
        });
        $state.transitionTo('tabs.buyandsell.coinbase', {
          code: code
        });
      });
      return true;

      // BitPayCard Authentication
    } else if (data && data.indexOf(appConfigService.name + '://') === 0) {

      // Disable BitPay Card
      if (!appConfigService._enabledExtensions.debitcard) return false;

      var secret = getParameterByName('secret', data);
      var email = getParameterByName('email', data);
      var otp = getParameterByName('otp', data);
      var reason = getParameterByName('r', data);

      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        switch (reason) {
          default:
            case '0':
            /* For BitPay card binding */
            $state.transitionTo('tabs.bitpayCardIntro', {
              secret: secret,
              email: email,
              otp: otp
            });
          break;
        }
      });
      return true;

      // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;

      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      $state.go('tabs.home', {}, {
        'reload': true,
        'notify': $state.current.name == 'tabs.home' ? false : true
      }).then(function() {
        $state.transitionTo('tabs.add.join', {
          url: data
        });
      });
      return true;
    } else if (data && (data.substring(0, 2) == '6P' || checkPrivateKey(data))) {
      root.showMenu({
        data: data,
        type: 'privateKey'
      });
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      $state.go('tabs.home').then(function() {
        $state.transitionTo('tabs.add.import', {
          code: data
        });
      });
      return true;

    } else {
      if ($state.includes('tabs.scan')) {
        root.showMenu({
          data: data,
          type: 'text'
        });
      }
    }

    return false;

  };

  function goToAmountPage(toAddress, privatePayment) {
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    });
    $timeout(function() {
      console.log('incomingData goToAmountPage', privatePayment);
      $state.transitionTo('tabs.send.amount', {
        toAddress: toAddress,
        privatePayment: privatePayment,
      });
    }, 100);
  }

  function handlePayPro(payProDetails) {
    var stateParams = {
      toAmount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      paypro: payProDetails
    };
    scannerService.pausePreview();
    $state.go('tabs.send', {}, {
      'reload': true,
      'notify': $state.current.name == 'tabs.send' ? false : true
    }).then(function() {
      $timeout(function() {
        $state.transitionTo('tabs.send.confirm', stateParams);
      });
    });
  }

  return root;
});
