'use strict';

angular.module('copay.network')
  .factory('NetworkTest', function() {
    this.f = function() {
      return 2;
    };
  })
  .factory('Network', function() {
    var peer;
    var connectedPeers = {};

    var _onConnect = function(c, cb) {
      if (c.label === 'wallet') {
        var a = peer.connections[c.peer][0];
        console.log(peer.connections[c.peer]);
        a.send('------ origin recived -------');
        
        c.on('data', function(data) {
          console.log('------ new data ------');
          console.log(data);


          console.log(peer.connections);


          c.on('close', function() {
            alert(c.peer + ' has left the wallet.');
            delete connectedPeers[c.peer];
          });
        });

        setTimeout(function() {
          a.send('.........................');
          cb(c.peer);
        }, 1000);
      }
    };

    var _init = function(cb) {
      peer = new Peer({
        key: 'lwjd5qra8257b9',
        debug: 3
      });

      peer.on('open', cb);
    };

    var _connect = function(pid, cb) {
      peer.on('connection', function(conn) {
        _onConnect(conn, cb);
      });

      var c = peer.connect(pid, {
        label: 'wallet',
        serialization: 'none',
        reliable: false,
        metadata: { message: 'hi! copayers' }
      });

      c.on('open', function() {
        c.send('-------oopen-------');
      });

      c.on('data', function(data) {
        if (data)
        console.log(data);
      });

      c.on('error', function(err) {
        console.error(err);
      });
    };

    var _sendTo = function(pid, data) {
      if (typeof pids === 'string') {
        // just send
      } else if (typeof pids === 'array') {
        // iter
      }
      console.log(data);
    };

    return {
      init: _init,
      connect: _connect,
      sendTo: _sendTo
    } 
  });

