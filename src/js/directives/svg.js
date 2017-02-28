'use strict';

angular.module('copayApp.directives')
  /**
   * Replaces img tag with its svg content to allow for CSS styling of the svg.
   */
  .directive('svg', function($http) {
    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        var imgId = attrs.id;
        var imgClass = attrs.class;
        var imgUrl = attrs.src;
        var svg;

        // Load svg content
        $http.get(imgUrl).success(function(data, status) {
          svg = angular.element(data);
          for (var i = svg.length - 1; i >= 0; i--) {
            if (svg[i].constructor == SVGSVGElement) {
              svg = angular.element(svg[i]);
              break;
            }
          }

          if (typeof imgId !== 'undefined') {
            svg.attr('id', imgId);
          }

          if (typeof imgClass !== 'undefined') {
            svg.attr('class', imgClass);
          }
          // Remove invalid attributes
          svg = svg.removeAttr('xmlns:a');
          element.replaceWith(svg);
        });

        scope.$on('$destroy', function() {
          if (svg) svg.remove();
        });
      }
    };
  });
    