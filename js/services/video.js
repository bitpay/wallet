'use strict';

var Video = function() {
  navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
};

Video.prototype.setOwnPeer = function(peer, cb) {
  var self = this;

  navigator.getUserMedia({
    audio: true,
    video: true
  }, function(stream) {
    // Set your video displays
    cb(null, peer.id, URL.createObjectURL(stream));
    window.localStream = stream;
  }, function() {
    cb(new Error('Failed to access the webcam and microphone.'));
  });
  // Receiving a call
  peer.on('call', function(call) {
    // Answer the call automatically (instead of prompting user) for demo purposes
    call.answer(window.localStream);
    self.addCall(call, cb);
  });
  peer.on('error', function(err) {
    console.log('ERROR on video peer '+err);
  });
  this.peer = peer;
};

Video.prototype.addPeer = function(peerID, cb) {
  var call = this.peer.call(peerID, window.localStream);
  this.addCall(call, cb);
};

Video.prototype.addCall = function(call, cb) {
  var peerID = call.id;

  // Wait for stream on the call, then set peer video display
  call.on('stream', function(stream) {
    cb(null, peerID, URL.createObjectURL(stream));
  });

  call.on('close', function() {
    // TODO: use peerID
  });
}

angular.module('copay.video').value('video', new Video());
