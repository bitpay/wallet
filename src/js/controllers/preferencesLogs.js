'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
  function(historicLog) {
    this.logs = historicLog.get();
console.log('[preferencesLogs.js.5:historicLog:]',this.logs); //TODO
  });
