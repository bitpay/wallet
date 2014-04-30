'use strict';

var Video = function() {
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  this.mediaConnections = {};
  this.localStream = null;
  this.onlineSound = new Audio('../../sound/online.wav');
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
  var self = this;
  var peerID = mediaConnection.peer;

  // Wait for stream on the call, then set peer video display
  mediaConnection.on('stream', function(stream) {
    self.onlineSound.play();
    cb(null, peerID, URL.createObjectURL(stream));
  });

  mediaConnection.on('close', function() {
    console.log('Media connection closed with ' + peerID);
    cb(true, peerID, null); // ask to stop video streaming in UI
  });
  mediaConnection.on('error', function(e) {
    console.log('Media connection error with ' + peerID);
    cb(e, peerID, null);
  });
  this.mediaConnections[peerID] = mediaConnection;
}

Video.prototype.close = function() {
  this.localStream.stop();
  this.localStream.mozSrcObject = null;
  this.localStream.src = "";
  this.localStream.src = null;
  this.localStream = null;
  for (var i = 0; this.mediaConnections.length; i++) {
    this.mediaConnections[i].close();
  }
  this.mediaConnections = {};
};

angular.module('copay.video').value('video', new Video());
