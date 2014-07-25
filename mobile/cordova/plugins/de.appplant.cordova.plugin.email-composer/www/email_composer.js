/*
    Copyright 2013-2014 appPlant UG

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

var EmailComposer = function () {

};

EmailComposer.prototype = {
    /**
     * Displays the email composer pre-filled with data.
     *
     * @param {Object} options
     *      Different properties of the email like the body, subject
     * @param {Function} callback
     *      A callback function to be called with the result
     * @param {Object?} scope
     *      The scope of the callback
     */
    open: function (options, callback, scope) {
        var callbackFn = this.createCallbackFn(callback, scope),
            options    = options || {};

        var defaults = {
            subject:     null,
            body:        null,
            to:          null,
            cc:          null,
            bcc:         null,
            attachments: null,
            isHtml:      true
        }

        for (var key in defaults) {
            if (options[key] !== undefined) {
                defaults[key] = options[key];
            } else {
                console.log('EmailComposer plugin: unknown property "' + key + '"');
            }
        }

        cordova.exec(callbackFn, null, 'EmailComposer', 'open', [options]);
    },

    /**
     * Alias für `open()`.
     */
    openDraft: function () {
        this.open.apply(this, arguments);
    },

    /**
     * Verifies if sending emails is supported on the device.
     *
     * @param {Function} callback
     *      A callback function to be called with the result
     * @param {Object} scope
     *      The scope of the callback
     */
    isServiceAvailable: function (callback, scope) {
        var callbackFn = this.createCallbackFn(callback, scope);

        cordova.exec(callbackFn, null, 'EmailComposer', 'isServiceAvailable', []);
    },

    /**
     * @private
     *
     * Creates a callback, which will be executed within a specific scope.
     *
     * @param {Function} callbackFn
     *      The callback function
     * @param {Object} scope
     *      The scope for the function
     *
     * @return {Function}
     *      The new callback function
     */
    createCallbackFn: function (callbackFn, scope) {
        return function () {
            if (typeof callbackFn == 'function') {
                callbackFn.apply(scope || this, arguments);
            }
        }
    }
};

var plugin = new EmailComposer();

module.exports = plugin;