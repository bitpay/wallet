// var serveStatic = require('serve-static');
// var serveIndex = require('serve-index');
// var bodyParser = require('body-parser');
var PATH = require('path');

var express = require('express');
var app = express();
app.set('port', 8200);

//teaTable
app.use(logger);
app.use('/', express.static('www'));
app.use('/cordova/ios', express.static('platforms/ios/platform_www')); //dummy. 로컬 빌드용
app.use('/cordova/and', express.static('platforms/android/platform_www')); //dummy. 로컬 빌드용

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

function logger(req, res, next) {
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    console.log(new Date(), ip, req.method, req.url);
    next();
}