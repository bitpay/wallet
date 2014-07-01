'use strict';

var UriHandler = function() {};

UriHandler.prototype.register = function() {
  var base = window.location.origin + '/';
  var url = base + '#/uri_payment/%s';
  console.log(url);
  navigator.registerProtocolHandler('bitcoin',
    url, 'Copay');
};

angular.module('copayApp.services').value('uriHandler', new UriHandler());
