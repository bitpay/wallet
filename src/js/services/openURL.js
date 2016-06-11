'use strict';

angular.module('copayApp.services').factory('openURLService', function($ionicHistory, $document, $log, $state, go) {
  var root = {};

  root.registeredUriHandlers = [{
    name: 'Bitcoin BIP21 URL',
    startsWith: 'bitcoin:',
    transitionTo: 'uripayment',
  }, {
    name: 'Glidera Authentication Callback',
    startsWith: 'copay://glidera',
    transitionTo: 'uriglidera',
  }, {
    name: 'Coinbase Authentication Callback',
    startsWith: 'copay://coinbase',
    transitionTo: 'uricoinbase',
  }];


  var handleOpenURL = function(args) {
    $log.info('Handling Open URL: ' + JSON.stringify(args));

    // Stop it from caching the first view as one to return when the app opens
    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableBack: true,
      disableAnimation: true
    });

    if (url) {
      window.cordova.removeDocumentEventHandler('handleopenurl');
      window.cordova.addStickyDocumentEventHandler('handleopenurl');
      document.removeEventListener('handleopenurl', root.handleOpenUrl);
    }


    var url = args.url;

    lodash.each(root.registeredUriHandlers, function(x) {
      if (url.indexOf(x.startWith) == 0) {
        $log.debug('openURL GOT ' + x.name + ' URL');
        return $state.transitionTo(x.transitionTo, {
          url: url
        });
      }
    });
    $log.warn('Unknown URL! : ' + url);
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenUrl, false);
  };

  root.init = function() {
    console.log('[openURL.js.29]'); //TODO
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);
  };


  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  return root;
});
