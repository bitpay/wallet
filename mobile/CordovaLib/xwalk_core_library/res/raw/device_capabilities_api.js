// Copyright (c) 2013 Intel Corporation. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Implementation of the W3C's Device Capabilities API.
// http://www.w3.org/2012/sysapps/device-capabilities/

var internal = requireNative('internal');
internal.setupInternalExtension(extension);

var v8tools = requireNative('v8tools');
var common = requireNative('sysapps_common');
common.setupSysAppsCommon(internal, v8tools);

var Promise = requireNative('sysapps_promise').Promise;

var DeviceCapabilities = function() {
  common.BindingObject.call(this, common.getUniqueId());
  common.EventTarget.call(this);

  internal.postMessage("deviceCapabilitiesConstructor", [this._id]);

  this._addEvent("displayconnect");
  this._addEvent("displaydisconnect");
  this._addEvent("storageattach");
  this._addEvent("storagedetach");

  this._addMethodWithPromise("getAVCodecs", Promise);
  this._addMethodWithPromise("getCPUInfo", Promise);
  this._addMethodWithPromise("getDisplayInfo", Promise);
  this._addMethodWithPromise("getMemoryInfo", Promise);
  this._addMethodWithPromise("getStorageInfo", Promise);
};

DeviceCapabilities.prototype = new common.EventTargetPrototype();
DeviceCapabilities.prototype.constructor = DeviceCapabilities;

exports = new DeviceCapabilities();
