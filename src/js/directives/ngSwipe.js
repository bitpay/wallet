'use strict';

/*  
 * This is a modification from https://github.com/angular/angular.js/blob/master/src/ngTouch/swipe.js
 */


function makeSwipeDirective(directiveName, direction, eventName) {
  angular.module('copayApp.directives')
    .directive(directiveName, ['$parse', '$swipe',
      function($parse, $swipe) {
        // The maximum vertical delta for a swipe should be less than 75px.
        var MAX_VERTICAL_DISTANCE = 75;
        // Vertical distance should not be more than a fraction of the horizontal distance.
        var MAX_VERTICAL_RATIO = 0.4;
        // At least a 30px lateral motion is necessary for a swipe.
        var MIN_HORIZONTAL_DISTANCE = 30;

        return function(scope, element, attr) {
          var swipeHandler = $parse(attr[directiveName]);

          var startCoords, valid;

          function validSwipe(coords) {
            // Check that it's within the coordinates.
            // Absolute vertical distance must be within tolerances.
            // Horizontal distance, we take the current X - the starting X.
            // This is negative for leftward swipes and positive for rightward swipes.
            // After multiplying by the direction (-1 for left, +1 for right), legal swipes
            // (ie. same direction as the directive wants) will have a positive delta and
            // illegal ones a negative delta.
            // Therefore this delta must be positive, and larger than the minimum.
            if (!startCoords) return false;
            var deltaY = Math.abs(coords.y - startCoords.y);
            var deltaX = (coords.x - startCoords.x) * direction;
            return valid && // Short circuit for already-invalidated swipes.
              deltaY < MAX_VERTICAL_DISTANCE &&
              deltaX > 0 &&
              deltaX > MIN_HORIZONTAL_DISTANCE &&
              deltaY / deltaX < MAX_VERTICAL_RATIO;
          }

          var pointerTypes = ['touch'];
          $swipe.bind(element, {
            'start': function(coords, event) {
              startCoords = coords;
              valid = true;
            },
            'move': function(coords, event) {
              if (validSwipe(coords)) {
                scope.$apply(function() {
                  element.triggerHandler(eventName);
                  swipeHandler(scope, {
                    $event: event
                  });
                });
              }
            }
          }, pointerTypes);
        };
      }
    ]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
makeSwipeDirective('ngSwipeRight', 1, 'swiperight');
