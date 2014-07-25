/**
 * Copyright (c) 2014 Intel Corporation. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

window.screen.show = function() {
  extension.postMessage("hideLaunchScreen");
};
