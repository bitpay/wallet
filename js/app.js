'use strict';

var copay = require('copay');
var _ = require('lodash');
var config = defaultConfig;

var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;

var localStorage;
if (isChromeApp) {
  var storage = chrome.storage.local;

  var myAccess = 'myAccess';

  var obj = {};

  obj[myAccess] = Math.floor((Math.random() * 1000) + 1);;

  storage.get(myAccess, function(result) {
    console.log('Last access 1', JSON.stringify(myAccess), JSON.stringify(result));
  });

  storage.set(obj);

  storage.get(myAccess, function(result) {
    console.log('Last access 2', JSON.stringify(myAccess), JSON.stringify(result));
  });



  console.log('Is a chrome app!...app.js');
  console.log('chrome.storage', chrome.storage);
  chrome.storage.local.set({
    'MiNombre': 'Matias'
  }, function(done) {
    console.log('Saving  to local storage', done);
  });
  localStorage = chrome.storage.local;



  console.log('localStorage', localStorage);
} else {
  console.log('Is web!');
  localStorage = window.localStorage;
}

console.log('access to localStorage');

var localConfig;
if (localStorage) {

  if (isChromeApp) {
    var result;
    localStorage.getItem('config', function(data) {
      result = data;
    });

    console.log('retrieving data from local storage', result);
    localConfig = JSON.parse(result);
  } else {
    localConfig = JSON.parse(localStorage.getItem('config'));
    console.log('localStorage', localConfig);
  }
} else {

  console.log('localStorage is null ');
}


var defaults = JSON.parse(JSON.stringify(defaultConfig));

if (localConfig) {
  var cmv = copay.version.split('.')[1];
  var lmv = localConfig.version ? localConfig.version.split('.')[1] : '-1';
  if (cmv === lmv) {
    _.each(localConfig, function(value, key) {
      config[key] = value;
    });
  }
}

var modules = [
  'ngRoute',
  'angularMoment',
  'mm.foundation',
  'monospaced.qrcode',
  'ngIdle',
  'gettext',
  'ui.gravatar',
  'ngTouch',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
];

if (Object.keys(config.plugins).length)
  modules.push('angularLoad');


var copayApp = window.copayApp = angular.module('copayApp', modules);

copayApp.value('defaults', defaults);

copayApp.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'mailto:**'
  ]);
});

angular.module('ui.gravatar').config([
  'gravatarServiceProvider',
  function(gravatarServiceProvider) {
    gravatarServiceProvider.defaults = {
      size: 35
    };
    // Use https endpoint
    gravatarServiceProvider.secure = true;
  }
]);

angular.module('copayApp.filters', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
