'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope) {
    var peer;
    $rootScope.connectedPeers = [];
    $rootScope.connectedTo = [];
    $rootScope.masterId = null;
    $rootScope.peerId = null;

    var _arrayDiff = function(a, b) {
      var seen = [];
      var diff = [];

      for ( var i = 0; i < b.length; i++)
        seen[b[i]] = true;

      for ( var i = 0; i < a.length; i++)
        if (!seen[a[i]])
          diff.push(a[i]);

      return diff;
    };

    var _sender = function(pid, data) {
      if (pid !== $rootScope.peerId) {
        console.log('-------- sending data to: ' + pid + ' --------');
        var conns = peer.connections[pid];

        if (conns) {
          var str = JSON.stringify({
            sender: $rootScope.peerId,
            data: data
          });

          for (var i = 0; i < conns.length; i++) {
            var conn = conns[i];
            conn.send(str);
          }
        }
      }
    };

    var _onData = function(data) {
      console.log('-------- Data received --------');
      console.log(data);
      var obj = JSON.parse(data);

      if (obj.data.peers) {
        _connectToPeers(obj.data.peers);
      }
    };

    var _connectToPeers = function(peers) {
      var arrayDiff = _arrayDiff(peers, $rootScope.connectedTo);

      arrayDiff.forEach(function(pid) {
        _connect(pid);
      });
    };

    var _init = function(cb) {
      peer = new Peer($rootScope.peerId, {
        key: 'lwjd5qra8257b9', // TODO: we need our own PeerServer KEY (http://peerjs.com/peerserver)
        debug: 3
      });

      peer.on('open', function(pid) {
        $rootScope.peerId = pid;
        $rootScope.connectedPeers.push(pid);

        cb(pid);

        $rootScope.$digest();
      });

      peer.on('connection', function(conn) {
        if (conn.label === 'wallet') {
          conn.on('open', function() {
            console.log('-------- ' + conn.peer + ' conected to me --------');

            console.log($rootScope.masterId);
            console.log($rootScope.peerId);

            if ($rootScope.masterId === $rootScope.peerId) {
              console.log('-------- I am the master --------');
              var c = peer.connect(conn.peer, {
                label: 'wallet',
                serialization: 'none',
                reliable: false,
                metadata: { message: 'hi peer!' }
              });

              c.on('open', function() {
                $rootScope.connectedPeers.push(conn.peer);
                $rootScope.connectedTo.push(conn.peer);

                _send($rootScope.connectedPeers, { peers: $rootScope.connectedPeers });

                $rootScope.$digest();
              });
            }
          });
        }
      });

      peer.on('close', function() {
        console.log('------- connection closed ---------');
      });
    };

    var _connect = function(pid, cb) {
      if (pid !== $rootScope.peerId) {
        console.log('------- conecting to ' + pid + ' ------');
        var c = peer.connect(pid, {
          label: 'wallet',
          serialization: 'none',
          reliable: false,
          metadata: { message: 'hi copayer!' }
        });

        c.on('open', function() {
          console.log('-------- I\'m connected to ' + pid + ' ------');
          console.log($rootScope.connectedPeers);
          console.log($rootScope.connectedTo);

          $rootScope.connectedPeers.push(pid);
          $rootScope.connectedTo.push(pid);

          if (typeof cb === 'function')
            cb();

          $rootScope.$digest();

          console.log($rootScope.connectedPeers);
          console.log($rootScope.connectedTo);
        });

        c.on('data', _onData);

        c.on('error', function(err) {
          console.error('-------- Error --------')
        });
      }
    };

    var _send = function(pids, data) {
      if (Array.isArray(pids)) {
        pids.forEach(function(pid) {
          _sender(pid, data);
        }); 
      } else if (typeof pids === 'string') {
        _sender(pid, data);
      }
    };

    var _disconnect = function() {
      peer.disconnect();
      peer.destroy();
      console.log('Disconnected and destroyed connection');
    }

    return {
      init: _init,
      connect: _connect,
      send: _send,
      disconnect: _disconnect
    } 
  });

