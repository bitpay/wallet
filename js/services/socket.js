'use strict';

angular.module('copay.socket').factory('Socket',
  function($rootScope) {
    var listeners = [];
    var url = 'http://' + config.socket.host + ':' + config.socket.port;
    var socket = io.connect(url, {
      'reconnect': true,
      'reconnection delay': 500,
      'force new connection': true,
    });

    socket.on('error', function(a,b){
      alert('Could not connect to Insight. Please check your settings.');
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
      getListeners: function() {
        var ret = {};
        var addrList = listeners.map(function(i) {return i.event;});
        for (var i in addrList) {
          ret[addrList[i]] = 1;
        }
        return ret;
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
