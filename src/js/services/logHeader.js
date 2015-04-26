'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($log, isChromeApp, isCordova) {
    $log.info('Starting Copay v' + window.version + ' #' + window.commitHash);
    $log.info('Client: isCordova:', isCordova, 'isChromeApp:', isChromeApp);
    $log.info('Navigator:', navigator.userAgent);

    return {};
  });
