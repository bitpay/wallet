'use strict';

var Video = function() {
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
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
    for (var i=0; i<online.length; i++) {
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
    alert('answering call from ' + mediaConnection.peer);
    if (self.localStream) {
      mediaConnection.answer(self.localStream);
    } else {
      mediaConnection.answer();
    }
    self._addCall(mediaConnection, cb);
  });
  peer.on('error', function(err) {
    alert('error on video peer '+err);
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
  alert('_addCall ' + peerID);

  // Wait for stream on the call, then set peer video display
  mediaConnection.on('stream', function(stream) {
    alert('STREAM ON ADD CALL');
    cb(null, peerID, URL.createObjectURL(stream));
  });

  mediaConnection.on('close', function() {
    alert('CLOSEEEEEEEEEEEEEEE ON ADD CALL');
  });
  mediaConnection.on('error', function() {
    alert('ERROR ON ADD CALL');
  });
}

angular.module('copay.video').value('video', new Video());
