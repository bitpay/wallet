'use strict';

angular.module('copayApp.directives')
  .directive('slideToAccept', function($timeout, $window, $q) {
    return {
      restrict: 'E',
      templateUrl: 'views/includes/slideToAccept.html',
      transclude: true,
      scope: {
        sendStatus: '=slideSendStatus',
        onConfirm: '&slideOnConfirm',
        isDisabled: '=isDisabled'
      },
      link: function(scope, element, attrs) {

        var KNOB_WIDTH = 71;
        var MAX_SLIDE_START_PERCENTAGE = 50;
        var FULLY_SLID_PERCENTAGE = 72;
        var PERCENTAGE_BUMP = 5;
        var JIGGLE_EASING = linear;
        var JIGGLE_DURATION = 100;
        var RECEDE_DURATION = 250;
        var INITIAL_TAP_EASE_DURATION = 75;

        var elm = element[0];
        var isSliding = false;
        var curSliderPct = getKnobWidthPercentage();
        var curBitcoinPct = 0;
        var curTextPct = 0;
        var currentEaseStartTime;
        var bezier = $window.BezierEasing(0.175, 0.885, 0.320, 1.275);

        scope.isSlidFully = false;
        scope.displaySendStatus = '';

        scope.$watch('sendStatus', function() {
          if (!scope.sendStatus) {
            reset();
          } else if (scope.sendStatus === 'success') {
            scope.displaySendStatus = '';
            $timeout(function() {
              reset();
            }, 500);
          } else {
            scope.displaySendStatus = scope.sendStatus;
          }
        });

        function easePosition(fromPct, pct, duration, easeFx, animateFx) {
          var deferred = $q.defer();
          currentEaseStartTime = Date.now();
          var startTime = currentEaseStartTime;
          var initialPct = fromPct;
          var distance = pct - fromPct;

          function ease() {
            if (startTime !== currentEaseStartTime) {
              return;
            }
            $window.requestAnimationFrame(function() {
              var now = Date.now();
              var elapsed = now - startTime;
              var normalizedElapsedTime = elapsed / duration;
              var newVal = easeFx(normalizedElapsedTime);
              var newPct = newVal * distance + initialPct;
              animateFx(newPct);
              scope.$digest();
              if (elapsed < duration) {
                ease();
              } else {
                deferred.resolve();
              }
            });
          }
          ease();
          return deferred.promise;
        }

        function linear(t) {
          return t;
        }

        function easeInOutBack(t) {
          return bezier(t);
        }

        function reset() {
          scope.isSlidFully = false;
          isSliding = false;
          setNewSliderStyle(getKnobWidthPercentage());
          setNewBitcoinStyle(0);
          setNewTextStyle(0);
        }

        function setNewSliderStyle(pct) {
          var knobWidthPct = getKnobWidthPercentage();
          var translatePct = pct - knobWidthPct;
          if (isSliding) {
            translatePct += 0.35 * pct;
          }
          scope.sliderStyle = getTransformStyle(translatePct);
          curSliderPct = pct;
        }

        function setNewBitcoinStyle(pct) {
          var translatePct = -2.25 * pct;
          scope.bitcoinStyle = getTransformStyle(translatePct);
          curBitcoinPct = pct;
        }

        function setNewTextStyle(pct) {
          var translatePct = -0.1 * pct;
          scope.textStyle = getTransformStyle(translatePct);
          curTextPct = pct;
        }

        function getTransformStyle(translatePct) {
          return {
            'transform': 'translateX(' + translatePct + '%)'
          };
        }

        function getKnobWidthPercentage() {
          var knobWidthPct = (KNOB_WIDTH / elm.clientWidth) * 100;
          return knobWidthPct;
        }

        function setSliderPosition(pct) {
          setNewSliderStyle(pct);
          setNewBitcoinStyle(pct);
          setNewTextStyle(pct);
        }

        function easeSliderPosition(pct) {
          var duration = INITIAL_TAP_EASE_DURATION;
          easePosition(curSliderPct, pct, duration, JIGGLE_EASING, function(pct) {
            setNewSliderStyle(pct);
          });
          easePosition(curBitcoinPct, pct, duration, JIGGLE_EASING, function(pct) {
            setNewBitcoinStyle(pct);
          });
          easePosition(curTextPct, pct, duration, JIGGLE_EASING, function(pct) {
            setNewTextStyle(pct);
          });
        }

        function jiggleSlider() {
          var pct = getKnobWidthPercentage() + PERCENTAGE_BUMP;
          var duration = JIGGLE_DURATION;
          var p1 = easePosition(curSliderPct, pct, duration, JIGGLE_EASING, function(pct) {
            setNewSliderStyle(pct);
          });
          var p2 = easePosition(curBitcoinPct, pct, duration, JIGGLE_EASING, function(pct) {
            setNewBitcoinStyle(pct);
          });

          $q.all([p1, p2]).then(function() {
            recede();
          });
        }

        function recede() {
          var duration = RECEDE_DURATION;
          easePosition(curSliderPct, getKnobWidthPercentage(), duration, easeInOutBack, function(pct) {
            setNewSliderStyle(pct);
          });
          easePosition(curBitcoinPct, 0, duration, easeInOutBack, function(pct) {
            setNewBitcoinStyle(pct);
          });
          easePosition(curTextPct, 0, duration, easeInOutBack, function(pct) {
            setNewTextStyle(pct);
          });
        }

        function alertSlidFully() {
          scope.isSlidFully = true;
          scope.onConfirm();
        }

        function getTouchXPosition($event) {
          var x;
          if ($event.touches || $event.changedTouches) {
            if ($event.touches.length) {
              x = $event.touches[0].clientX;
            } else {
              x = $event.changedTouches[0].clientX;
            }
          } else {
            x = $event.clientX;
          }
          return x;
        }

        function getSlidPercentage($event) {
          var x = getTouchXPosition($event);
          var width = elm.clientWidth;
          var pct = (x / width) * 100;
          if (x >= width) {
            pct = 100;
          }
          return pct;
        }

        scope.onTouchstart = function($event) {
          if (scope.isSlidFully) {
            return;
          }
          if (!isSliding) {
            var pct = getSlidPercentage($event);
            if (pct > MAX_SLIDE_START_PERCENTAGE) {
              jiggleSlider();
              return;
            } else {
              isSliding = true;
              var knobWidthPct = getKnobWidthPercentage();
              if (pct < knobWidthPct) {
                pct = knobWidthPct;
              }
              pct += PERCENTAGE_BUMP;
              easeSliderPosition(pct);
            }
          }
        };

        scope.onTouchmove = function($event) {
          if (!isSliding || scope.isSlidFully) {
            return;
          }
          var pct = getSlidPercentage($event);
          var knobWidthPct = getKnobWidthPercentage();
          if (pct < knobWidthPct) {
            pct = knobWidthPct;
          }
          pct += PERCENTAGE_BUMP;
          currentEaseStartTime = null;
          setSliderPosition(pct);
        };

        scope.onTouchend = function($event) {
          if (scope.isSlidFully) {
            return;
          }
          var pct = getSlidPercentage($event);
          if (isSliding && pct > FULLY_SLID_PERCENTAGE) {
            pct = 100;
            setSliderPosition(pct);
            alertSlidFully();
          } else {
            recede();
          }
          isSliding = false;
        };
      }
    };
  });
