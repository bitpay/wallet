'use strict';

angular.module('cosign',[
  'ngRoute',
  'ui.bootstrap',
  'cosign.header',
  'cosign.home',
  'cosign.transactions',
  'cosign.send',
  'cosign.backup'
]);

angular.module('cosign.header', []);
angular.module('cosign.home', []);
angular.module('cosign.transactions', []);
angular.module('cosign.send', []);
angular.module('cosign.backup', []);

