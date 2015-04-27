'use strict';

angular.module('copayApp.services').value('isChromeApp',  !!(window.chrome && chrome.runtime && chrome.runtime.id));

