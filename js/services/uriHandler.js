'use strict';

var UriHandler = function() {};

UriHandler.prototype.register = function() {
  navigator.registerProtocolHandler('bitcoin',
    'uri=%s',
    'Copay');
};

angular.module('copayApp.services').value('uriHandler', new UriHandler());
