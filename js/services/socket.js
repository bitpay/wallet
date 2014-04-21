'use strict';

angular.module('copay.socket').factory('Socket',
  function($rootScope) {
    var listeners = [];
    var url = 'http://' + config.socket.host + ':' + config.socket.port;
    var socket = io.connect(url, {
      'reconnect': true,
      'reconnection delay': 500,
    });

    return {
      on: function(event, callback) {
        var wrappedCallback = function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        };

        socket.on(event, wrappedCallback);

        if (event !== 'connect') {
          listeners.push({
            event: event,
            fn: wrappedCallback
          });
        }
      },
      emit: function(event, data, callback) {
        socket.emit(event, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      },
      removeAllListeners: function() {
        for (var i = 0; i < listeners.length; i++) {
          var details = listeners[i];
          socket.removeListener(details.event, details.fn);
        }

        listeners = [];
      }
    };
  });
