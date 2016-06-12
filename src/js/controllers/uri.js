'use strict';
angular.module('copayApp.controllers').controller('uriController',
  function($stateParams, $log, openURLService) {


    /* This is only for BROWSER links, it is not excecuted on mobile devices */

    $log.info('DEEP LINK from Browser:' + $stateParams.url);
    openURLService.handleURL({
      url: $stateParams.url
    });
  });
