'use strict';

angular.module('cosign',[
  'ngRoute',
  'mm.foundation',
  'monospaced.qrcode',
  'cosign.header',
  'cosign.home',
  'cosign.transactions',
  'cosign.send',
  'cosign.backup',
  'cosign.network',
  'cosign.signin',
  'cosign.join'
]);

angular.module('cosign.header', []);
angular.module('cosign.home', []);
angular.module('cosign.transactions', []);
angular.module('cosign.send', []);
angular.module('cosign.backup', []);
angular.module('cosign.network', []);
angular.module('cosign.signin', []);
angular.module('cosign.join', []);

