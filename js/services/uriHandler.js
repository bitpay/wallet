'use strict';

var UriHandler = function() {};

UriHandler.prototype.register = function() {
  var base = window.location.origin + '/';
  var url = base + '#/uri-payment/%s';
  navigator.registerProtocolHandler('bitcoin', url, 'Copay');
};

angular.module('copayApp.services').value('uriHandler', new UriHandler());
