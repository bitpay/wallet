'use strict';

var express = require('express');
var simulatedPluginServer1 = express();
// var simulatedPluginServer2 = express();
var pluginCSPReportingServer = express();
var url = require('url');
var proxy = require('proxy-middleware');
var jsonParser = require('body-parser').json({
  type: 'application/csp-report'
});
var chalk = require('chalk');

var port = process.argv[2];
if(typeof port === 'undefined'){
  console.log(chalk.yellow('No port provided – using port 8111.'));
  console.log();
  port = 8111;
}

var localPluginUrl1 = 'http://localhost:' + port;
// var localPluginUrl2 = 'http://localhost:' + (port + 1);
var exceptions = ['http://0.0.0.0:35731', 'ws://localhost:53711', 'ws://0.0.0.0:35731']; // for livereload, etc.
var CSPViolationUri = 'http://localhost:12999/report';

// lock down the CSP for simulatedPluginServer
var lockdown = function(req, res, next) {

    var CSP = 'default-src \'none\';' +
              'form-action \'none\';' +
              'sandbox allow-scripts allow-same-origin;' +
              'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' ' + exceptions.join(' ') + ';' +
              'connect-src \'self\' ' + exceptions.join(' ') + ';' +
              'img-src \'self\' data:  ' + exceptions.join(' ') + ';' +
              'style-src \'self\' \'unsafe-inline\' ' + exceptions.join(' ') + ';' +
              'font-src \'self\' ' + exceptions.join(' ') + ';' +
              'report-uri ' + CSPViolationUri + ';';

    res.setHeader(
      'Content-Security-Policy', CSP);
    return next();
  };

simulatedPluginServer1.use(lockdown);
// simulatedPluginServer2.use(lockdown);

simulatedPluginServer1.use('/', proxy(url.parse(localPluginUrl1)));
// simulatedPluginServer2.use('/', proxy(url.parse(localPluginUrl2)));

simulatedPluginServer1.listen(13000, function () {
  console.log(chalk.inverse('Proxying requests from ' + localPluginUrl1 + ' to port 13000.'));
  console.log();
  console.log(chalk.yellow('The following exceptions have been made for testing:'));
  console.log(chalk.yellow(exceptions.join(', ')));
  console.log();
});

// simulatedPluginServer2.listen(13001, function () {
//   console.log(chalk.inverse('Proxying requests from ' + localPluginUrl2 + ' to port 13001.'));
//   console.log();
//   console.log(chalk.yellow('The following exceptions have been made for testing:'));
//   console.log(chalk.yellow(exceptions.join(', ')));
//   console.log();
// });

pluginCSPReportingServer.post('/report', jsonParser, function(req, res){
  if(req.body['csp-report']){
    var blockedUri = req.body['csp-report']['blocked-uri'];
    var violatedDirective = req.body['csp-report']['violated-directive'];
    console.log(chalk.red('A plugin security violation was blocked. URI: ' + blockedUri + ' – Violated directive: ' + violatedDirective));
  }
  res.sendStatus(200);
});

pluginCSPReportingServer.listen(12999, function(){
  console.log(chalk.blue('Listening for CSP violations at: '+ CSPViolationUri));
  console.log();
});
