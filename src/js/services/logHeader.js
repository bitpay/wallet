'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($log, isChromeApp, isCordova, nodeWebkit, brand) {
    $log.info('Starting Copay v' + brand.version + ' #' + brand.commitHash);
    $log.info('Client: isCordova:', isCordova, 'isChromeApp:', isChromeApp, 'isNodeWebkit:', nodeWebkit.isDefined());
    $log.info('Navigator:', navigator.userAgent);
    return {};
  });
