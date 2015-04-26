'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
function(historicLog, isCordova) {
  this.logs = historicLog.get();
  this.isCordova = isCordova;

  this.sendLogs = function() {
    var body = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
    body += '\n\n';
    body += this.logs.map(function(v) {
      return v.msg;
    }).join('\n');

    var properties = {
      subject: 'Copay Logs',
      body: body,
      isHtml: false
    };
    window.plugin.email.open(properties);
  };
});
