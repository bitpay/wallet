'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope, Storage) {
    var peer;
    $rootScope.connectedPeers = [];
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
        connectedPeers: $rootScope.connectedPeers
      });
    };

    var _sendToOne = function(pid, data, cb) {
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

    var _onData = function(data, isOutbound) {
      var obj = JSON.parse(data);
      console.log('### RECEIVED TYPE: %s FROM %s', obj.data.type, obj.sender); 
      switch(obj.data.type) {
        case 'peerList':
          if (_connectToPeers(obj.data.peers)) {
            //TODO Remove log
            console.log('### BROADCASTING PEER LIST');
            _send( $rootScope.connectedPeers, { 
                  type: 'peerList', 
                  peers: $rootScope.connectedPeers,
                  isBroadcast: 1,
            });
            $rootScope.$digest();
          }
          else if (!isOutbound && !obj.data.isBroadcast) {
            // replying always to connecting peer
            console.log('### REPLYING PEERLIST TO:', obj.sender );
            _send( obj.sender, { 
                  type: 'peerList', 
                  peers: $rootScope.connectedPeers
            });
          }
          break;
        case 'disconnect':
          _onClose(obj.sender);
          break;
        case 'publicKeyRing':
          console.log('### RECEIVED PKR FROM:', obj.sender); 

          if ($rootScope.publicKeyRing.merge(obj.data.publicKeyRing, true)) { 
            //TODO Remove log
            console.log('### BROADCASTING PRK');
            _send( $rootScope.connectedPeers, { 
                  type: 'publicKeyRing', 
                  publicKeyRing: $rootScope.publicKeyRing.toObj(),
                  isBroadcast: 1,
            });
            $rootScope.$digest();
          }
          else if (!isOutbound && !obj.data.isBroadcast) {
            // replying always to connecting peer
            console.log('### REPLYING PRK TO:', obj.sender );
            _send( obj.sender, { 
                  type: 'publicKeyRing', 
                  publicKeyRing: $rootScope.publicKeyRing.toObj(),
            });
 
          }

          //TODO Remove log
          console.log('*** PRK:', $rootScope.publicKeyRing.toObj());
          break;
      }
    };

    var _onClose = function(pid) {
      $rootScope.connectedPeers = _arrayRemove(pid, $rootScope.connectedPeers);
      _saveDataStorage();

      $rootScope.$digest();
    };

    var _connectToPeers = function(peers) {
      var ret = false;
      var arrayDiff1= _arrayDiff(peers, $rootScope.connectedPeers);
      var arrayDiff = _arrayDiff(arrayDiff1, [$rootScope.peerId]);
      arrayDiff.forEach(function(pid) {
        console.log('### CONNECTING TO:',pid);
        ret = true;
        connect(pid);
      });
      return ret;
    };

    // public methods
    var init = function(cb) {
      peer = new Peer($rootScope.peerId, {
        key: 'lwjd5qra8257b9', // TODO: we need our own PeerServer KEY (http://peerjs.com/peerserver)
        debug: 3
      });


      $rootScope.publicKeyRing = new copay.PublicKeyRing({
        network: config.networkName,
      });
      $rootScope.publicKeyRing.addCopayer();
      console.log('### PublicKeyRing Initialized');


      peer.on('open', function(pid) {
        console.log('### PEER OPEN. I AM:' + pid);
        $rootScope.peerId = pid;
        _saveDataStorage();

        cb();
        $rootScope.$digest();
      });

      peer.on('connection', function(dataConn) {
        if (dataConn.label === 'wallet') {
          console.log('### NEW INBOUND CONNECTION'); //TODO
          dataConn.on('open', function() {
            if (!_inArray(dataConn.peer, $rootScope.connectedPeers)) {
              console.log('### INBOUND DATA CONNECTION READY TO:' + dataConn.peer); //TODO
              _arrayPushOnce(dataConn.peer, $rootScope.connectedPeers);
              _saveDataStorage();

              $rootScope.$digest();
            }
          });

          dataConn.on('data', _onData);
          dataConn.on('error', function(e) {
            console.log('### ## INBOUND DATA ERROR',e ); //TODO
            _onClose(dataConn.peer);
          });
          dataConn.on('close', function() {
            _onClose(dataConn.peer);
          });
        }
      });
    };

    var connect = function(pid, cb) {
      if (pid !== $rootScope.peerId) {

        console.log('### STARTING CONNECT TO:' + pid );

        var dataConn = peer.connect(pid, {
          label: 'wallet',
          serialization: 'none',
          reliable: true,
          metadata: { message: 'hi copayer!' }
        });

        dataConn.on('open', function() {

          console.log('### OUTBOUND DATA CONN READY TO:' + pid );
          _arrayPushOnce(pid, $rootScope.connectedPeers);
          _saveDataStorage();

          console.log('#### SENDING PEER LIST: '  +$rootScope.connectedPeers);
          _send(pid, {
            type: 'peerList',
            peers: $rootScope.connectedPeers
          });
 

          console.log('#### SENDING PKR ');
          _send(dataConn.peer, { 
            type: 'publicKeyRing', 
            publicKeyRing: $rootScope.publicKeyRing.toObj(),
          });

          if (typeof cb === 'function') cb();
          
          $rootScope.$digest();
        });

        dataConn.on('data', function(data) {
          _onData(data,true);
        });

        dataConn.on('error', function(e) {
          console.log('### ## INBOUND DATA ERROR',e ); //TODO
          _onClose(dataConn.peer);
        });

        dataConn.on('close', function() {
          _onClose(dataConn.peer);
        });
      }
    };

    var _send = function(pids, data, cb) {
      if (Array.isArray(pids))
        pids.forEach(function(pid) {
          _sendToOne(pid, data, cb);
        });
      else if (typeof pids === 'string')
        _sendToOne(pids, data, cb);
    };

    var disconnect = function(cb) {
      Storage.remove('peerData');
      var conns = $rootScope.connectedPeers.length;
      var i = 1;
      _send($rootScope.connectedPeers, { type: 'disconnect' }, function() {
        i += 1;

        if (i === conns) {

          $rootScope.connectedPeers = [];
          $rootScope.peerId = null;
          peer.disconnect();
          peer.destroy();
          if (typeof cb === 'function') cb();
        }
      });
    }

    return {
      init: init,
      connect: connect,
      send: _send,
      disconnect: disconnect
    } 
  });

