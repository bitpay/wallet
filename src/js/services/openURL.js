'use strict';

angular.module('copayApp.services').factory('openURLService', function($rootScope, $ionicHistory, $document, $log, $state, go, platformInfo, lodash, profileService) {
  var root = {};

  root.registeredUriHandlers = [{
    name: 'Bitcoin BIP21 URL',
    startsWith: 'bitcoin:',
    transitionTo: 'uripayment',
  }, {
    name: 'Glidera Authentication Callback',
    startsWith: 'copay:glidera',
    transitionTo: 'uriglidera',
  }, {
    name: 'Coinbase Authentication Callback',
    startsWith: 'copay:coinbase',
    transitionTo: 'uricoinbase',
  }];


  var handleOpenURL = function(args) {
    $log.info('Handling Open URL: ' + JSON.stringify(args));

    if (!profileService.isBound) {
      $log.warn('Profile not bound yet. Waiting');

      return $rootScope.$on('Local/ProfileBound', function() {
        // Wait ux to settle
        setTimeout(function() {
          $log.warn('Profile ready, retrying...');
          handleOpenURL(args);
        }, 2000);
      });
    };

    // Stop it from caching the first view as one to return when the app opens
    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableBack: true,
      disableAnimation: true
    });
    var url = args.url;
    if (!url) {
      $log.error('No url provided');
      return;
    };

    if (url) {
      if ('cordova' in window) {
        window.cordova.removeDocumentEventHandler('handleopenurl');
        window.cordova.addStickyDocumentEventHandler('handleopenurl');
      }
      document.removeEventListener('handleopenurl', handleOpenURL);
    }

    document.addEventListener('handleopenurl', handleOpenURL, false);

    var x = lodash.find(root.registeredUriHandlers, function(x) {
      return url.indexOf(x.startsWith) == 0 ||
        url.indexOf('web+' + x.startsWith) == 0 || // web protocols
        url.indexOf(x.startsWith.replace(':', '://')) == 0 // from mobile devices
      ;
    });

    if (x) {
      $log.debug('openURL GOT ' + x.name + ' URL');
      return $state.transitionTo(x.transitionTo, {
        url: url
      });
    } else {
      $log.warn('Unknown URL! : ' + url);
    }
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenURL, false);
  };

  root.init = function() {
    $log.debug('Initializing openURL');
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);

    if (platformInfo.isChromeApp) {
      $log.debug('Registering Chrome message listener');
      chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.url) {
            handleOpenURL(request.url);
          }
        });
    } else if (platformInfo.isNW) {
      var gui = require('nw.gui');

      // This event is sent to an existent instance of Copay (only for standalone apps)
      gui.App.on('open', function(pathData) {
        if (pathData.indexOf('bitcoin:') != -1) {
          $log.debug('Bitcoin URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('bitcoin:'))
          });
        } else if (pathData.indexOf('copay:') != -1) {
          $log.debug('Copay URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('copay:'))
          });
        }
      });

      // Used at the startup of Copay
      var argv = gui.App.argv;
      if (argv && argv[0]) {
        handleOpenURL({
          url: argv[0]
        });
      }
    } else if (platformInfo.isDevel) {

      var base = window.location.origin + '/';
      var url = base + '#/uri/%s';

      if (navigator.registerProtocolHandler) {
        $log.debug('Registering Browser handlers base:' + base);
        navigator.registerProtocolHandler('bitcoin', url, 'Copay Bitcoin Handler');
        navigator.registerProtocolHandler('web+copay', url, 'Copay Wallet Handler');
      }
    }
  };

  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  root.handleURL = handleOpenURL;

  return root;
});
