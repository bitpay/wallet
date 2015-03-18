'use strict';

angular.module('copayApp.controllers').controller('pinController', function($scope, $timeout) {
  this.init = function(confirmPin, testPin) {
    this._firstpin = null;
    this.askForPin = 1;
    this.confirmPin = confirmPin;
    this.clear();
    if (testPin) {
      console.log('WARN: using test pin:', testPin);
      $timeout(function() {
        $scope.$emit('pin', testPin);
      }, 100);
    }
  };

  this.clear = function() {
    this.digits = [];
    this.defined = [];
  };

  this.press = function(digit) {
    var self = this;
    $timeout(function() {
      self._press(digit);
    }, 1);
  };

  this._press = function(digit) {
    var self = this;
    this.error = null;
    this.digits.push(digit);
    this.defined.push(true);

    if (this.digits.length == 4) {
      var pin = this.digits.join('');

      if (this.confirmPin) {
        if (!this._firstpin) {
          this._firstpin = pin;
          this.askForPin = 2;
          $timeout(function() {
            self.clear();
          }, 100);
          return;
        } else {
          if (pin === this._firstpin) {
            $scope.$emit('pin', pin);
            return;
          } else {
            this._firstpin = null;
            this.askForPin = 1;
            $timeout(function() {
              self.clear();
              self.error = 'Entered PINs were not equal. Try again';
              var _self = self;
              $timeout(function() {
                _self.error = null;
              }, 2000);
            }, 100);
            return;
          }
        }
      } else {
        $scope.$emit('pin', pin);
      }
    }
  };

  this.skip = function() {
    $scope.$emit('pin', null);
  };
});
