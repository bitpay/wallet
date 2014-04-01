'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope, Storage) {
    var peer;
    $rootScope.connectedPeers = [];
    $rootScope.connectedTo = [];
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

    var _isInArray = function(i, array) {
      return array.indexOf(i) > -1;
    };

    var _saveDataStorage = function() {
      Storage.save('peerData', {
        peerId: $rootScope.peerId,
        connectedTo: $rootScope.connectedTo,
        connectedPeers: $rootScope.connectedPeers
      });
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

      if (obj.data.type === 'connectToPeers')
        _connectToPeers(obj.data.peers);

      if (obj.data.type === 'getPeers')
        _send(obj.sender, {
          type: 'connectToPeers',
          peers: $rootScope.connectedPeers
        });
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

        if (!_isInArray(pid, $rootScope.connectedPeers))
          $rootScope.connectedPeers.push(pid);

        _saveDataStorage();

        cb();

        $rootScope.$digest();
      });

      peer.on('connection', function(conn) {
        if (conn.label === 'wallet') {
          conn.on('open', function() {
            console.log('<<<<<<<<<<< ' + conn.peer + ' conected to me --------');

            var isConnected = $rootScope.connectedTo.indexOf(conn.peer);
            if (isConnected === -1) {
              var c = peer.connect(conn.peer, {
                label: 'wallet',
                serialization: 'none',
                reliable: false,
                metadata: { message: 'hi copayer!' }
              });

              c.on('open', function() {
                console.log('>>>>>>>>> i am connected to ' + conn.peer);
                if (!_isInArray(conn.peer, $rootScope.connectedPeers))
                  $rootScope.connectedPeers.push(conn.peer);

                if (!_isInArray(conn.peer, $rootScope.connectedTo))
                  $rootScope.connectedTo.push(conn.peer);

                _saveDataStorage();

                $rootScope.$digest();
              });
            }
          });
        }
      });

      peer.on('data', _onData);

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
          $rootScope.connectedPeers.push(pid);
          $rootScope.connectedTo.push(pid);

          if (typeof cb === 'function') cb();

          _send(c.peer, { type: 'getPeers' });
          
          $rootScope.$digest();
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
        _sender(pids, data);
      }
    };

    var _disconnect = function() {
      peer.disconnect();
      peer.destroy();
      Storage.remove('peerData');
      console.log('Disconnected and destroyed connection');
    }

    return {
      init: _init,
      connect: _connect,
      send: _send,
      disconnect: _disconnect
    } 
  });

