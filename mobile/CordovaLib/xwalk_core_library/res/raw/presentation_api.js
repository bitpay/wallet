/**
 * Copyright (c) 2013 Intel Corporation. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

var v8toolsNative = requireNative("v8tools");

var DISPLAY_AVAILABLE_CHANGE_EVENT = "displayavailablechange";
var _listeners = {};
var _displayAvailable = false;
var _nextRequestId = 0;
var _showRequests = {};

function DOMError(msg) {
  this.name = msg;
}

function ShowRequest(id, successCallback, errorCallback) {
  this._requestId = id;
  this._successCallback = successCallback;
  this._errorCallback = errorCallback;
}

/* TODO(hmin): Add Promise support instead of callback approach. */
function requestShowPresentation(url, successCallback, errorCallback) {
  if (typeof url !== "string" || typeof successCallback !== "function") {
    console.error("Invalid parameter for presentation.requestShow!");
    return;
  }

  // errorCallback is optional.
  if (errorCallback && typeof errorCallback != "function") {
    console.error("Invalid parameter for presentation.requestShow!");
    return;
  }

  var requestId = ++_nextRequestId;
  var request = new ShowRequest(requestId, successCallback, errorCallback);
  _showRequests[requestId] = request;
  // Requested url should be absolute.
  // If the requested url is relative, we need to combine it with baseUrl to make it absolute.
  var baseUrl = location.href.substring(0, location.href.lastIndexOf("/")+1);

  var message = { "cmd": "RequestShow", "requestId": requestId, "url": url, "baseUrl": baseUrl };
  extension.postMessage(JSON.stringify(message));
}

function addEventListener(name, callback, useCapture /* ignored */) {
  if (typeof name !== "string" || typeof callback !== "function") {
    console.error("Invalid parameter for presentation.addEventListener!");
    return;
  }

  if (!_listeners[name])
    _listeners[name] = [];
  _listeners[name].push(callback);
}

function removeEventListener(name, callback) {
  if (typeof name !== "string" || typeof callback !== "function") {
    console.error("Invalid parameter for presentation.removeEventListener!");
    return;
  }

  if (_listeners[name]) {
    var index = _listeners[name].indexOf(callback);
    if (index != -1)
      _listeners[name].splice(index, 1);
  }
}

function handleDisplayAvailableChange(isAvailable) {
  if (_displayAvailable == isAvailable)
    return;

  _displayAvailable = isAvailable;
  if (!_listeners[DISPLAY_AVAILABLE_CHANGE_EVENT])
    return;

  var length = _listeners[DISPLAY_AVAILABLE_CHANGE_EVENT].length;
  for (var i = 0; i < length; ++i) {
    _listeners[DISPLAY_AVAILABLE_CHANGE_EVENT][i].apply(null, null);
  }
}

function handleShowSucceeded(requestId, viewId) {
  var request = _showRequests[requestId];
  if (request) {
    var view = v8toolsNative.getWindowObject(viewId);
    request._successCallback.apply(null, [view]);
    delete _showRequests[requestId];
  }
}

function handleShowFailed(requestId, errorMessage) {
  var request = _showRequests[requestId];
  if (request) {
    var error = new DOMError(errorMessage);
    if (request._errorCallback)
      request._errorCallback.apply(null, [error]);
    delete _showRequests[requestId];
  }
}

extension.setMessageListener(function(json) {
  var msg = JSON.parse(json);
  if (msg.cmd == "DisplayAvailableChange") {
    /* Using setTimeout here to ensure the error in user-defined event handler
       would be captured in developer tools. */
    setTimeout(function() {
      handleDisplayAvailableChange(msg.data);
    }, 0);
  } else if (msg.cmd == "ShowSucceeded") {
    setTimeout(function() {
      handleShowSucceeded(msg.requestId, parseInt(msg.data) /* view id */);
    }, 0);
  } else if (msg.cmd == "ShowFailed") {
    setTimeout(function() {
      handleShowFailed(msg.requestId, msg.data /* error message */);
    }, 0);
  } else {
    console.error("Invalid message : " + msg.cmd);
  }
})

exports.requestShow = requestShowPresentation;
exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.__defineSetter__("on" + DISPLAY_AVAILABLE_CHANGE_EVENT,
  function(callback) {
    if (callback)
      addEventListener(DISPLAY_AVAILABLE_CHANGE_EVENT, callback);
    else
      removeEventListener(DISPLAY_AVAILABLE_CHANGE_EVENT,
                          this.ondisplayavailablechange);
  }
);

exports.__defineGetter__("displayAvailable", function() {
  var res = extension.internal.sendSyncMessage("QueryDisplayAvailability");
  _displayAvailable = (res == "true" ? true : false);
  return _displayAvailable;
});
