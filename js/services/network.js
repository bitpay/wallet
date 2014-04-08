'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope, Storage) {
    var peer;
//    $rootScope.connectedPeers = [];
//    $rootScope.peerId = null;

      //   case 'publicKeyRing':
      //     console.log('### RECEIVED PKR FROM:', obj.sender); 

      //     if ($rootScope.publicKeyRing.merge(obj.data.publicKeyRing, true)) { 
      //       //TODO Remove log
      //       console.log('### BROADCASTING PRK');
      //       _send( $rootScope.connectedPeers, { 
      //             type: 'publicKeyRing', 
      //             publicKeyRing: $rootScope.publicKeyRing.toObj(),
      //             isBroadcast: 1,
      //       });
      //       $rootScope.$digest();
      //     }
      //     else if (!isOutbound && !obj.data.isBroadcast) {
      //       // replying always to connecting peer
      //       console.log('### REPLYING PRK TO:', obj.sender );
      //       _send( obj.sender, { 
      //             type: 'publicKeyRing', 
      //             publicKeyRing: $rootScope.publicKeyRing.toObj(),
      //       });
 
      //     }

      //     //TODO Remove log
      //     console.log('*** PRK:', $rootScope.publicKeyRing.toObj());
      //     break;
      // }

      // // TODO
      // $rootScope.publicKeyRing = new copay.PublicKeyRing({
      //   network: config.networkName,
      // });
      // $rootScope.publicKeyRing.addCopayer();
      // console.log('### PublicKeyRing Initialized');
    //
    // // 

    //       console.log('#### SENDING PKR ');
    //       _send(dataConn.peer, { 
    //         type: 'publicKeyRing', 
    //         publicKeyRing: $rootScope.publicKeyRing.toObj(),
    //       });

    //       if (typeof cb === 'function') cb();
    //       
    //       $rootScope.$digest();
    //     });




    // public methods
    var init = function(cb) {

      var opts = {
        //peerId: <stored>
        apiKey: config.p2pApiKey,
        debug:  config.p2pDebug,
      };
      var cp = $rootScope.cp = new copay.CopayPeer(opts); 

      cp.on('update', function() {

        console.log('*** UPDATING UX'); //TODO

        $rootScope.peerId = cp.peerId;
        $rootScope.connectedPeers = cp.connectedPeers;

        Storage.set('peerData', {
          peerId: $rootScope.peerId,
          connectedPeers: $rootScope.connectedPeers
        });

        $rootScope.$digest();
      });

      // inicia session
      cp.start(function(peerId) {
        console.log('[kkkk.7] START: SOY', peerId); //TODO
//        networkPubKeyRing.setUpHandlers(cp);
//        networkTransactionProposal.setUpHandlers(cp);
        return cb();
      });
    };


    var connect = function(peerId, cb) {
      $rootScope.cp.connectTo(peerId, function(id) {
        console.log('CONNECTTO CALLBACK SOY:', id); //TODO
        return cb();
      });
    };

    var disconnect = function(cb) {
      if ($rootScope.cp) {
        $rootScope.cp.disconnect();
      }
      Storage.remove('peerData'); 
    };

    return {
      init: init,
      connect: connect,
      disconnect: disconnect
    } 
  });

