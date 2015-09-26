window.TrezorConnect = (function () {
    'use strict';

    var CONNECT_ORIGIN = 'https://trezor.github.io';
    var CONNECT_PATH = CONNECT_ORIGIN + '/connect';
    var CONNECT_POPUP = CONNECT_PATH + '/popup/popup.html';

    var ERR_TIMED_OUT = 'Loading timed out';
    var ERR_WINDOW_CLOSED = 'Window closed';
    var ERR_ALREADY_WAITING = 'Already waiting for a response';

    var manager = new PopupManager(
        CONNECT_POPUP,
        CONNECT_ORIGIN,
        'trezor-connect',
        function () {
            var w = 600;
            var h = 500;
            var x = (screen.width - w) / 2;
            var y = (screen.height - h) / 3;
            var params =
                'height=' + h +
                ',width=' + w +
                ',left=' + x +
                ',top=' + y +
                ',menubar=no' +
                ',toolbar=no' +
                ',location=no' +
                ',personalbar=no' +
                ',status=no';
            return params;
        }
    );

    /**
     * Public API.
     */
    function TrezorConnect() {

        /**
         * Popup errors.
         */
        this.ERR_TIMED_OUT = ERR_TIMED_OUT;
        this.ERR_WINDOW_CLOSED = ERR_WINDOW_CLOSED;
        this.ERR_ALREADY_WAITING = ERR_ALREADY_WAITING;

        /**
         * @typedef XPubKeyResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} xpubkey  serialized extended public key
         */

        /**
         * Load BIP32 extended public key by path.
         *
         * Path can be specified either in the string form ("m/44'/1/0") or as
         * raw integer array.
         *
         * @param {string|array<number>} path
         * @param {function(XPubKeyResult)} callback
         */
        this.getXPubKey = function (path, callback) {
            if (typeof path === 'string') {
                path = parseHDPath(path);
            }
            manager.sendWithChannel({
                'type': 'xpubkey',
                'path': path
            }, function (result) {
                manager.close();
                callback(result);
            });
        };

        /**
         * @typedef SignTxResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} serialized_tx      serialized tx, in hex, including signatures
         * @param {?array<string>} signatures  array of input signatures, in hex
         */

        /**
         * Sign a transaction in the device and return both serialized
         * transaction and the signatures.
         *
         * @param {array<TxInputType>} inputs
         * @param {array<TxOutputType>} outputs
         * @param {function(SignTxResult)} callback
         *
         * @see https://github.com/trezor/trezor-common/blob/master/protob/types.proto
         */
        this.signTx = function (inputs, outputs, callback) {
            manager.sendWithChannel({
                'type': 'signtx',
                'inputs': inputs,
                'outputs': outputs
            }, function (result) {
                manager.close();
                callback(result);
            });
        };

        /**
         * @typedef RequestLoginResult
         * @param {boolean} success
         * @param {?string} error
         * @param {?string} public_key        public key used for signing, in hex
         * @param {?string} signature         signature, in hex
         */

        /**
         * Sign a login challenge for active origin.
         *
         * @param {?string} hosticon
         * @param {string} challenge_hidden
         * @param {string} challenge_visual
         * @param {string|function(RequestLoginResult)} callback
         *
         * @see https://github.com/trezor/trezor-common/blob/master/protob/messages.proto
         */
        this.requestLogin = function (
            hosticon,
            challenge_hidden,
            challenge_visual,
            callback
        ) {
            if (typeof callback === 'string') {
                // special case for a login through <trezor:login> button.
                // `callback` is name of global var
                callback = window[callback];
            }
            if (!callback) {
                throw new TypeError('TrezorConnect: login callback not found');
            }
            manager.sendWithChannel({
                'type': 'login',
                'icon': hosticon,
                'challenge_hidden': challenge_hidden,
                'challenge_visual': challenge_visual
            }, function (result) {
                manager.close();
                callback(result);
            });
        };

        var LOGIN_CSS =
            '<style>@import url("' + CONNECT_PATH + '/login_buttons.css")</style>';

        var LOGIN_ONCLICK =
            'TrezorConnect.requestLogin('
            + "'@hosticon@','@challenge_hidden@','@challenge_visual@','@callback@'"
            + ')';

        var LOGIN_HTML =
            '<div id="trezorconnect-wrapper">'
            + '  <a id="trezorconnect-button" onclick="' + LOGIN_ONCLICK + '">'
            + '    <span id="trezorconnect-icon"></span>'
            + '    <span id="trezorconnect-text">@text@</span>'
            + '  </a>'
            + '  <span id="trezorconnect-info">'
            + '    <a id="trezorconnect-infolink" href="https://www.buytrezor.com/"'
            + '       target="_blank">What is TREZOR?</a>'
            + '  </span>'
            + '</div>';

        /**
         * Find <trezor:login> elements and replace them with login buttons.
         * It's not required to use these special elements, feel free to call
         * `TrezorConnect.requestLogin` directly.
         */
        this.renderLoginButtons = function () {
            var elements = document.getElementsByTagName('trezor:login');

            for (var i = 0; i < elements.length; i++) {
                var e = elements[i];
                var text = e.getAttribute('text') || 'Sign in with TREZOR';
                var callback = e.getAttribute('callback') || '';
                var hosticon = e.getAttribute('icon') || '';
                var challenge_hidden = e.getAttribute('challenge_hidden') || '';
                var challenge_visual = e.getAttribute('challenge_visual') || '';

                // it's not valid to put markup into attributes, so let users
                // supply a raw text and make TREZOR bold
                text = text.replace('TREZOR', '<strong>TREZOR</strong>');

                e.parentNode.innerHTML =
                    LOGIN_CSS + LOGIN_HTML
                    .replace('@text@', text)
                    .replace('@callback@', callback)
                    .replace('@hosticon@', hosticon)
                    .replace('@challenge_hidden@', challenge_hidden)
                    .replace('@challenge_visual@', challenge_visual);
            }
        };
    }

    var exports = new TrezorConnect();
    exports.renderLoginButtons();
    return exports;

    /*
     * `getXPubKey()`
     */

    function parseHDPath(string) {
        return string
            .toLowerCase()
            .split('/')
            .filter(function (p) { return p !== 'm'; })
            .map(function (p) {
                var n = parseInt(p);
                if (p[p.length - 1] === "'") { // hardened index
                    n = n | 0x80000000;
                }
                return n;
            });
    }

    /*
     * Popup management
     */

    function Popup(url, name, params) {
        var w = window.open(url, name, params);

        var interval;
        var iterate = function () {
            if (w.closed) {
                clearInterval(interval);
                if (this.onclose) {
                    this.onclose();
                }
            }
        }.bind(this);
        interval = setInterval(iterate, 100);

        this.window = w;
        this.onclose = null;
    }

    function Channel(target, origin, waiting) {

        var respond = function (data) {
            if (waiting) {
                var callback = waiting;
                waiting = null;
                callback(data);
            }
        };

        var receive = function (event) {
            if (event.source === target && event.origin === origin) {
                respond(event.data);
            }
        };

        window.addEventListener('message', receive);

        this.respond = respond;

        this.close = function () {
            window.removeEventListener('message', receive);
        };

        this.send = function (value, callback) {
            if (waiting === null) {
                waiting = callback;
                target.postMessage(value, origin);
            } else {
                throw new Error(ERR_ALREADY_WAITING);
            }
        };
    }

    function ConnectedChannel(url, origin, name, params) {

        var ready = function () {
            clearTimeout(this.timeout);
            this.popup.onclose = null;
            this.ready = true;
            this.onready();
        }.bind(this);

        var closed = function () {
            clearTimeout(this.timeout);
            this.channel.close();
            this.onerror(new Error(ERR_WINDOW_CLOSED));
        }.bind(this);

        var timedout = function () {
            this.popup.onclose = null;
            this.popup.window.close();
            this.channel.close();
            this.onerror(new Error(ERR_TIMED_OUT));
        }.bind(this);

        this.popup = new Popup(url, name, params);
        this.channel = new Channel(this.popup.window, origin, ready);
        this.timeout = setTimeout(timedout, 5000);

        this.popup.onclose = closed;

        this.ready = false;
        this.onready = null;
        this.onerror = null;
    }

    function PopupManager(url, origin, name, onparams) {
        var cc = null;

        var closed = function () {
            cc.channel.respond(new Error(ERR_WINDOW_CLOSED));
            cc.channel.close();
            cc = null;
        };

        var open = function (callback) {
            cc = new ConnectedChannel(url, origin, name, onparams());
            cc.onready = function () {
                cc.popup.onclose = closed;
                callback(cc.channel);
            };
            cc.onerror = function (error) {
                cc = null;
                callback(error);
            };
        };

        this.close = function () {
            if (cc) {
                cc.popup.window.close();
            }
        };

        this.waitForChannel = function (callback) {
            if (cc) {
                if (cc.ready) {
                    callback(cc.channel);
                } else {
                    callback(new Error(ERR_ALREADY_WAITING));
                }
            } else {
                open(callback);
            }
        };

        this.sendWithChannel = function (message, callback) {
            var onresponse = function (response) {
                if (response instanceof Error) {
                    callback({success: false, error: response.message});
                } else {
                    callback(response);
                }
            };
            var onchannel = function (channel) {
                if (channel instanceof Error) {
                    callback({success: false, error: channel.message});
                } else {
                    channel.send(message, onresponse);
                }
            }
            this.waitForChannel(onchannel);
        };
    }

}());
