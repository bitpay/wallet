'use strict';

angular.module('copayApp.directives')
  .directive('copyToClipboard', function(platformInfo, nodeWebkitService, gettextCatalog, ionicToast, clipboard) {
    return {
      restrict: 'A',
      scope: {
        copyToClipboard: '=copyToClipboard'
      },
      link: function(scope, elem, attrs, ctrl) {
        var isCordova = platformInfo.isCordova;
        var isChromeApp = platformInfo.isChromeApp;
        var isNW = platformInfo.isNW;
        elem.bind('mouseover', function() {
          elem.css('cursor', 'pointer');
        });

        var msg = gettextCatalog.getString('Copied to clipboard');
        elem.bind('click', function() {
          var data = scope.copyToClipboard;
          if (!data) return;

          if (isCordova) {
            window.cordova.plugins.clipboard.copy(data);
            window.plugins.toast.showShortCenter(msg);
          } else if (isNW) {
            nodeWebkitService.writeToClipboard(data);
            scope.$apply(function() {
              ionicToast.show(msg, 'bottom', false, 1000);
            });
          } else if (clipboard.supported) {
            clipboard.copyText(data);
            scope.$apply(function() {
              ionicToast.show(msg, 'bottom', false, 1000);
            });
          }
        });
      }
    }
  });
