'use strict';

var UriHandler = function() {};

UriHandler.prototype.register = function() {
  var base = window.location.origin + '/';
  var url = base + '#!/uri-payment/%s';

  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  if(navigator.registerProtocolHandler && !isFirefox) {
    navigator.registerProtocolHandler('bitcoin', url, 'Copay');
  }
};

angular.module('copayApp.services').value('uriHandler', new UriHandler());
