'use strict';

var Video = function() {
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  this.mediaConnections = {};
};

Video.prototype.setOwnPeer = function(peer, wallet, cb) {
  var self = this;


  navigator.getUserMedia({
    audio: true,
    video: true
  }, function(stream) {
    // This is called when user accepts using webcam
    self.localStream = stream;
    var online = wallet.getOnlinePeerIDs();
    for (var i = 0; i < online.length; i++) {
      var o = online[i];
      var mc = self.mediaConnections[o];
      if (o !== peer.id) {
        self.callPeer(o, cb);
      }
    }
    cb(null, peer.id, URL.createObjectURL(stream));
  }, function() {
    cb(new Error('Failed to access the webcam and microphone.'));
  });

  // Receiving a call
  peer.on('call', function(mediaConnection) {
    if (self.localStream) {
      mediaConnection.answer(self.localStream);
    } else {
      mediaConnection.answer();
    }
    self.mediaConnections[mediaConnection.peer] = mediaConnection;
    self._addCall(mediaConnection, cb);
  });
  this.peer = peer;
};

Video.prototype.callPeer = function(peerID, cb) {
  if (this.localStream) {
    var mediaConnection = this.peer.call(peerID, this.localStream);
    this._addCall(mediaConnection, cb);
  }
};

Video.prototype._addCall = function(mediaConnection, cb) {
  var peerID = mediaConnection.peer;

  // Wait for stream on the call, then set peer video display
  mediaConnection.on('stream', function(stream) {
    cb(null, peerID, URL.createObjectURL(stream));
  });

  mediaConnection.on('close', function() {
  });
  mediaConnection.on('error', function() {
  });
}

angular.module('copay.video').value('video', new Video());
