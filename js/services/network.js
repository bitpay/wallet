'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope, Storage) {
    var peer;
    $rootScope.connectedPeers = [];
    $rootScope.connectedTo = [];
    $rootScope.peerId = null;

    // Array helpers
    var _arrayDiff = function(a, b) {
      var seen = [];
      var diff = [];

      for (var i = 0; i < b.length; i++)
        seen[b[i]] = true;

      for (var i = 0; i < a.length; i++)
        if (!seen[a[i]])
          diff.push(a[i]);

      return diff;
    };

    var _inArray = function(el, array) {
      return array.indexOf(el) > -1;
    };

    var _arrayPushOnce = function(el, array) {
      if (!_inArray(el, array)) array.push(el);
    };

    var _arrayRemove = function(el, array) {
      var pos = array.indexOf(el);
      if (pos >= 0) array.splice(pos, 1);

      return array;
    };

    // General helpers
    var _saveDataStorage = function() {
      Storage.save('peerData', {
        peerId: $rootScope.peerId,
        connectedTo: $rootScope.connectedTo,
        connectedPeers: $rootScope.connectedPeers
      });
    };

    var _sender = function(pid, data, cb) {
      if (pid !== $rootScope.peerId) {
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

          if (typeof cb === 'function') cb();
        }
      }
    };

    var _onData = function(data) {
      var obj = JSON.parse(data);

      switch(obj.data.type) {
        case 'connectedPeers':
          _connectToPeers(obj.data.peers);
          break;
        case 'getPeers':
          _send(obj.sender, {
            type: 'connectToPeers',
            peers: $rootScope.connectedPeers
          });
          break;
        case 'disconnect':
          _onClose(obj.sender);
          break;
      }
    };

    var _onClose = function(pid) {
      $rootScope.connectedPeers = _arrayRemove(pid, $rootScope.connectedPeers);
      $rootScope.connectedTo = _arrayRemove(pid, $rootScope.connectedTo);

      _saveDataStorage();

      $rootScope.$digest();
    };

    var _connectToPeers = function(peers) {
      var arrayDiff = _arrayDiff(peers, $rootScope.connectedTo);

      arrayDiff.forEach(function(pid) {
        _connect(pid);
      });
    };

    // public methods
    var init = function(cb) {
      peer = new Peer($rootScope.peerId, {
        key: 'lwjd5qra8257b9', // TODO: we need our own PeerServer KEY (http://peerjs.com/peerserver)
        debug: 3
      });

      peer.on('open', function(pid) {
        $rootScope.peerId = pid;
        _arrayPushOnce(pid, $rootScope.connectedPeers);
        _saveDataStorage();

        cb();

        $rootScope.$digest();
      });

      peer.on('connection', function(conn) {
        if (conn.label === 'wallet') {
          conn.on('open', function() {
            if (!_inArray(conn.peer, $rootScope.connectedTo)) {
              var c = peer.connect(conn.peer, {
                label: 'wallet',
                serialization: 'none',
                reliable: false,
                metadata: { message: 'hi copayer!' }
              });

              c.on('open', function() {
                $rootScope.connectedTo.push(conn.peer);
                _arrayPushOnce(conn.peer, $rootScope.connectedPeers);
                _saveDataStorage();

                $rootScope.$digest();
              });

              c.on('data', _onData);

              c.on('close', function() {
                _onClose(c.peer);
              });
            }
          });
        }
      });
    };

    var connect = function(pid, cb) {
      if (pid !== $rootScope.peerId) {
        var c = peer.connect(pid, {
          label: 'wallet',
          serialization: 'none',
          reliable: false,
          metadata: { message: 'hi copayer!' }
        });

        c.on('open', function() {
          _arrayPushOnce(pid, $rootScope.connectedTo);
          _arrayPushOnce(pid, $rootScope.connectedPeers);

          _send(pid, { type: 'getPeers' });
          _saveDataStorage();

          if (typeof cb === 'function') cb();
          
          $rootScope.$digest();
        });

        c.on('data', _onData);

        c.on('close', function() {
          _onClose(c.peer);
        });
      }
    };

    var _send = function(pids, data, cb) {
      if (Array.isArray(pids))
        pids.forEach(function(pid) {
          _sender(pid, data, cb);
        });
      else if (typeof pids === 'string')
        _sender(pids, data, cb);
    };

    var disconnect = function(cb) {
      var conns = $rootScope.connectedPeers.length;
      var i = 1;

      _send($rootScope.connectedPeers, { type: 'disconnect' }, function() {
        i += 1;

        if (i === conns) {
          peer.disconnect();
          peer.destroy();

          if (typeof cb === 'function') cb();
        }
      });

      Storage.remove('peerData');

      $rootScope.connectedPeers = [];
      $rootScope.connectedTo = [];
      $rootScope.peerId = null;
    }

    return {
      init: init,
      connect: connect,
      send: _send,
      disconnect: disconnect
    } 
  });

