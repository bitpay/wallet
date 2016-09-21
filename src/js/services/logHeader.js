'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($window, $log, platformInfo) {
    $log.info($window.appConfig.nameCase + ' v' + window.version + ' #' + window.commitHash);
    $log.info('Client: '+ JSON.stringify(platformInfo) );
    return {};
  });
