(function(window, chrome, angular, async, ProtoBuf, ByteBuffer) {
    'use strict';

    angular.module('hid')
        .service('bitloxHidWeb', HidAPI);

    HidAPI.$inject = [
        '$q', '$timeout', '$interval', '$rootScope',
        'Toast', 'hexUtil', 'txUtil', 'messageUtil',
        'VENDOR_ID', 'PRODUCT_ID', 'RECEIVE_CHAIN', 'CHANGE_CHAIN',
        'hidCommands'
    ];

    var PULSE_INTERVAL = (30 * 1000);

    function HidAPI($q, $timeout, $interval, $rootScope,
                    Toast, hexUtil, txUtil, messageUtil,
                    VENDOR_ID, PRODUCT_ID, RECEIVE_CHAIN, CHANGE_CHAIN,
                    hidCommands) {
        this.VENDOR_ID = VENDOR_ID;
        this.PRODUCT_ID = PRODUCT_ID;
        this.RECEIVE_CHAIN = RECEIVE_CHAIN;
        this.CHANGE_CHAIN = CHANGE_CHAIN;
        this.Toast = Toast;
        this._plugin = null;
        this.version = null;
        this.path = null;
        this._device = null;
        this._builder = null;

        this.$q = $q;
        this.$timeout = $timeout;
        this.$interval = $interval;

        this.commands = hidCommands;

        this.hexUtil = hexUtil;
        this.messageUtil = messageUtil;
        this.getTxHex = txUtil.getHex;

        this.$scope = $rootScope.$new();
        this.$scope.status = HidAPI.STATUS_DISCONNECTED;
    }

    HidAPI.TYPE_INITIALIZE         = HidAPI.prototype.TYPE_INITIALIZE = 'initialize';
    HidAPI.TYPE_PUBLIC_ADDRESS     = HidAPI.prototype.TYPE_PUBLIC_ADDRESS = 'public address';
    HidAPI.TYPE_ADDRESS_COUNT      = HidAPI.prototype.TYPE_ADDRESS_COUNT = 'address count';
    HidAPI.TYPE_WALLET_LIST        = HidAPI.prototype.TYPE_WALLET_LIST = 'wallet list';
    HidAPI.TYPE_PONG               = HidAPI.prototype.TYPE_PONG = 'pong';
    HidAPI.TYPE_SUCCESS            = HidAPI.prototype.TYPE_SUCCESS = 'success';
    HidAPI.TYPE_ERROR              = HidAPI.prototype.TYPE_ERROR = 'error';
    HidAPI.TYPE_UUID               = HidAPI.prototype.TYPE_UUID = 'uuid';
    HidAPI.TYPE_SIGNATURE          = HidAPI.prototype.TYPE_SIGNATURE = 'signature';
    HidAPI.TYPE_PLEASE_ACK         = HidAPI.prototype.TYPE_PLEASE_ACK = 'please ack';
    HidAPI.TYPE_PLEASE_OTP         = HidAPI.prototype.TYPE_PLEASE_OTP = 'please otp';
    HidAPI.TYPE_XPUB               = HidAPI.prototype.TYPE_XPUB = 'xpub';
    HidAPI.TYPE_SIGNATURE_RETURN   = HidAPI.prototype.TYPE_SIGNATURE_RETURN = 'signature return';
    HidAPI.TYPE_MESSAGE_SIGNATURE  = HidAPI.prototype.TYPE_MESSAGE_SIGNATURE = 'message signature';

    HidAPI.STATUS_DISCONNECTED     = HidAPI.prototype.STATUS_DISCONNECTED = "disconnected";
    HidAPI.STATUS_CONNECTED        = HidAPI.prototype.STATUS_CONNECTED = "connected";
    HidAPI.STATUS_READING          = HidAPI.prototype.STATUS_READING = "reading";
    HidAPI.STATUS_WRITING          = HidAPI.prototype.STATUS_WRITING = "writing";


    // function to get the plugin from the document element
    HidAPI.prototype.plugin = function() {
        if (this._plugin === null) {
            console.debug("plugin: device is null, finding on document");
            this._plugin = document.getElementById('hidapiPlugin');
        }
        console.debug("plugin: found", this._plugin);
        return this._plugin;
    };

    // Get the device. If we alreay have it, just return it.
    // Otherwise, do a hidraw scan and find, then open, the device
    HidAPI.prototype.device = function() {
        var hidapi = this;
        if (hidapi._device !== null) {
            return hidapi._device;
        }
        if (hidapi.pulse) {
            hidapi.$interval.cancel(hidapi.pulse);
        }
        // get the hid plugin
        console.debug("device: looking for plugin");
        var plugin = hidapi.plugin();
        if (plugin === null) {
            hidapi.close();
            return hidapi._device; // it's still null
        }
        console.debug("device: found plugin", plugin);
        // and list all of the hidraw devices that match our
        // vendor and product ids
        console.debug("device: looking for devices");
        var devices = plugin.hid_enumerate(hidapi.VENDOR_ID, hidapi.PRODUCT_ID);
        console.debug("device: found devices", devices);
        // if we do not find it, return null
        if (!devices.length) {
            hidapi.close();
            hidapi.Toast.error("No devices connected");
            return null;
        }
        // otherwise, get the path
        var path = hidapi.path = devices[0].path;
        // and open it
        console.debug("device: opening path", path);
        hidapi._device = hidapi.plugin().hid_open_path(path);
        console.debug("device: path opened", hidapi._device);
        // if the device is null still, there was an error opening the
        // path
        if (hidapi._device === null) {
            hidapi.close();
            hidapi.Toast.error("Error opening device");
            return null;
        }
        hidapi.$scope.status = hidapi.STATUS_CONNECTED;
        // set up the heartbeat interval if it does now exist
        if (!hidapi.pulse) {
            hidapi.pulse = hidapi.$interval(function() {
                // only do this if we are not already doing something
                if (!hidapi.doingCommand &&
                    hidapi.$scope.status !== hidapi.STATUS_READING &&
                    hidapi.$scope.status !== hidapi.STATUS_WRITING) {
                    console.debug("heartbeat");
                    hidapi.ping().catch(function() {
                        hidapi.close();
                    });
                }
            }, PULSE_INTERVAL);
        }
        // return the newly found device
        return hidapi._device;
    };

    HidAPI.prototype.protoBuilder = function() {
        if (this._builder === null) {
            var builder = ProtoBuf.loadProtoFile("../proto/messages.proto");
            this._builder = builder.build();
        }
        return this._builder;
    };

    HidAPI.prototype.pluginDetect = function() {
        var plugin = navigator.plugins[name];
        if (typeof(plugin) !== "undefined") {
            var re = /([0-9.]+)\.dll/; // look for the version at the end of the filename, before dll
            // Get the filename
            var filename = plugin.filename;
            // Search for the version
            var fnd;
            fnd = re.exec(filename);
            if (fnd === null) { // no version found
                if (plugin.version) {
                    this.version = plugin.version;
                    return this.version;
                } else {
                    return true; // plugin installed, unknown version
                }
            } else {
                this.version = fnd[1];
                return this.version; // plugin installed, returning version
            }

        } else {
            console.error("Plugin missing");
            return null;
        }
    };

    HidAPI.prototype.chunkData = function(data, chunkSize) {
        if (chunkSize === undefined) {
            chunkSize = 2;
        }
        return data.match(new RegExp('.{1,' + chunkSize + '}', 'g'));
    };

    function pausecomp(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }

    HidAPI.prototype.write = function(data) {
        var hidapi = this;
        hidapi.$scope.status = hidapi.STATUS_WRITING;
        var deferred = this.$q.defer();
        this.$timeout(function() {
            // get the device
            var dev = hidapi.device();
            if (dev === null) {
                hidapi.close();
                return deferred.reject(new Error("No device to write to"));
            }
            // check remainder against 8 bytes and add 4 null bytes if we
            // have 0, 6, or 7 bytes of space left over
            var remainder = data.length % 16;
            if (remainder === 0 || remainder === 12 || remainder === 14) {
                data = '00000000' + data;
            }
            // split into 16 byte chunks
            var chunks = hidapi.chunkData(data, 32);
            // keep track of the total sent
            var totalSent = 0;
            for(var i = 0; i < chunks.length; i++) {
                var thisData = chunks[i];
                if (thisData.length) {
                    thisData = '00' + thisData;
                    // if this is the final chunk, append the terminator
                    if (i + 1 === chunks.length) {
                        thisData += '7E7E';
                    }
                    // write to the device
                    var txResult = dev.hid_write(thisData);
                    pausecomp(50);
                    // if we did not write anything, return 0 to fail the
                    // send
                    if (txResult <= 0) {
                        hidapi.close();
                        return deferred.reject(new Error("Write error"));
                    }
                    // add to the total sent
                    totalSent += txResult;
                }
            }
            return deferred.resolve(totalSent);
        });
        return deferred.promise.finally(function() {
            hidapi.$scope.status = hidapi.STATUS_CONNECTED;
        });
    };

    var trimBeef = new RegExp('^(DEAD|BEEF|ADBEEF|EFDEAD)(DEAD|BEEF)+(2323)');
    HidAPI.prototype.hidRead = function(size, timeout) {
        if (timeout === undefined) {
            timeout = 3000;
        }
        if (size === undefined) {
            size = 64;
        }
        var hidapi = this;
        var deferred = this.$q.defer();
        this.$timeout(function() {
            var result;
            try {
                result = hidapi.device().hid_read(size, timeout).replace(trimBeef, '$3');
                deferred.resolve(result);
            } catch (ex) {
                console.error(ex);
                return deferred.reject(ex);
            }
        });
        return deferred.promise;
    };

    var magic = '2323';
    var magicRegexp = new RegExp(magic);
    var magicRegexpEdge = new RegExp('BEEF(23){1,2}$');
    HidAPI.prototype.read = function(serialData, wait) {
        if (serialData === undefined) {
            serialData = '';
        }
        var hidapi = this;
        return this.hidRead().then(function(newData) {
            hidapi.$scope.status = hidapi.STATUS_READING;
            serialData = serialData + newData;
            if (magicRegexpEdge.test(serialData)) {
                return hidapi.read(serialData, wait);
            }
            if (magicRegexp.test(serialData)) {
                // find the position of the magic string
                var headerPosition = serialData.search(magic);
                // if the header is close enough to the end that the
                // command and content length could be cut off, go ahead
                // and get more data
                if (headerPosition >= (serialData.length - (64 - 48))) {
                    return hidapi.read(serialData, wait);
                }
                // command is the 2 bytes after the magic
                var command = serialData.substring(headerPosition + 4, headerPosition + 8);
                // payload size is 4 bytes after command
                var payloadSize = serialData.substring(headerPosition + 8, headerPosition + 16);
                // parse the hex number to decimal
                var decPayloadSize = parseInt(payloadSize, 16);
                // if the content length is longer than the rest of the
                // data, go get some more
                if ((headerPosition + 16 + (2 * decPayloadSize)) > serialData.length) {
                    return hidapi.read(serialData, wait);
                }
                // the payload will start after 8 bytes
                var payload = serialData.substring(headerPosition + 16, headerPosition + 16 + (2 * (decPayloadSize)));
                return hidapi.processResults(command, payloadSize, payload);
            } else if (!wait && serialData === "") { //If nothing is detected, close down port
                console.warn("Device unplugged");
                hidapi.close();
                return null;
            } else {
                return null;
            }
        }).finally(function() {
            hidapi.$scope.status = hidapi.STATUS_CONNECTED;
        });
    };

    HidAPI.prototype.processResults = function(command, length, payload) {
        var Device = this.protoBuilder();
        command = command.substring(2, 4);
        var data = {
            type: null,
            payload: {}
        };

        switch (command) {
        case "3A": // initialize
            data.type = HidAPI.TYPE_INITIALIZE;
            break;
        case "30": // public address
            data.type = HidAPI.TYPE_PUBLIC_ADDRESS;
            data.payload.ecdsa = payload.substring(8, 74);
            data.payload.ripe160of2 = payload.substring(78, 118);
            break;
        case "31": // number of addresses in loaded wallet
            data.type = HidAPI.TYPE_ADDRESS_COUNT;
            data.payload.count = payload.substring(2, 4);
            break;
        case "32": // Wallet list
            data.type = HidAPI.TYPE_WALLET_LIST;
            data.payload.wallets = Device.Wallets.decodeHex(payload).wallet_info;
            break;
        case "33": // Ping response
            data.type = HidAPI.TYPE_PONG;
            data.payload = Device.PingResponse.decodeHex(payload);
            break;
        case "34": // success
            data.type = HidAPI.TYPE_SUCCESS;
            break;
        case "35": // general purpose error/cancel
            data.type = HidAPI.TYPE_ERROR;
            var hidErr = Device.Failure.decodeHex(payload);
            data.payload = new Error(hidErr.error_message.toString('utf8'));
            data.payload.code = parseInt(hidErr.error_code, 10);
//             console.debug("got error returned");
            break;
        case "36": // device uuid return
            data.type = HidAPI.TYPE_UUID;
            data.payload = Device.DeviceUUID.decodeHex(payload);
            break;
        case "39": // signature return [original]
            data.type = HidAPI.TYPE_SIGNATURE;
            data.payload = Device.Signature.decodeHex(payload);
            break;
        case "50": // please ack
            data.type = HidAPI.TYPE_PLEASE_ACK;
            break;
        case "56": // please otp
            data.type = HidAPI.TYPE_PLEASE_OTP;
            break;
        case "62": // parse & insert xpub from current wallet //RETURN from scan wallet
            data.type = HidAPI.TYPE_XPUB;
            data.payload = Device.CurrentWalletXPUB.decodeHex(payload);
            break;
        case "64": // signature return
            data.type = HidAPI.TYPE_SIGNATURE_RETURN;
            var signedScripts = [];
            var sigs = Device.SignatureComplete.decodeHex(payload).signature_complete_data;
            sigs.forEach(function(sig) {
                var sigHex = sig.signature_data_complete.toString('hex');
                var sigSize = parseInt(sigHex.slice(0, 2), 16);
                var sigChars = 2 + (sigSize * 2);
                sigHex = sigHex.slice(0, sigChars);
                signedScripts.push(sigHex);
            });
            data.payload = {
                signedScripts: signedScripts
            };
//         	console.debug("got sig returned");
            break;
        case "71": // message signing return
            data.type = HidAPI.TYPE_MESSAGE_SIGNATURE;
            var protoSig = Device.SignatureMessage.decodeHex(payload).signature_data_complete;
            data.payload = this.hexUtil.hexToBytes(protoSig.toString('hex'));
            break;
        default:
            data.type = HidAPI.TYPE_ERROR;
            data.payload = new Error("Unknown command received: 00" + command);
            data.payload.code = 1;
            break;
        }
        return data;
    };

    HidAPI.prototype.close = function() {
        var hidapi = this;
        hidapi.$scope.status = null;
        hidapi._device = null;
        hidapi._plugin = null;
        console.debug("closed");
        return hidapi.$timeout(function() {
            console.debug("settng to disconnected");
            hidapi.$scope.status = hidapi.STATUS_DISCONNECTED;
        });
    };

    var readTimeout = 10;
    var counterMax = (120 * 1000) / readTimeout; // appx 2 minutes timeout

    HidAPI.prototype._doCommand = function(command, expectedType) {
        var hidapi = this;
        if(hidapi.$scope.status === hidapi.STATUS_DISCONNECTED) {
          return hidapi.$q.reject(new Error("App is not in HID mode or HID is disconnected"))
        }
        hidapi.doingCommand = true;
        return hidapi.write(command).then(function(written) {
            if (written === 0) {
                return hidapi.close().then(function() {
                    return hidapi.$q.reject(new Error("No data written"));
                });
            } else if (written === -1) {
                return hidapi.close().then(function() {
                    return hidapi.$q.reject(new Error("Write error"));
                });
            }
            var counter = 0;
            var doRead = function() {
                return hidapi.read('', 'wait please').then(function(data) {
                    counter += 1;
                    if (data === null) {
                        if (counter === counterMax) { // two minutes... ish
                            return hidapi.close().then(function() {
                                return hidapi.$q.reject(new Error("Command response timeout"));
                            });
                        }
                        return hidapi.$timeout(doRead, readTimeout);
                    } else if (data.type === HidAPI.TYPE_ERROR) {
						if (expectedType === hidapi.TYPE_SIGNATURE_RETURN) {
							if (counter === counterMax) { // two minutes... ish
								return hidapi.close().then(function() {
									return hidapi.$q.reject(new Error("Command response timeout"));
								});
							}
							return hidapi.$timeout(doRead, readTimeout);
						} else {
							hidapi.doingCommand = false;
							return hidapi.$q.reject(data.payload);
						}
                    } else if (data.type === HidAPI.TYPE_PLEASE_ACK) {
                        return hidapi._doCommand(hidapi.commands.button_ack, expectedType);
                    } else if (expectedType) {
                        if (data.type === expectedType) {
                            // we got what we wanted, return it
                            hidapi.doingCommand = false;
                            return data;
                        }
                        return hidapi.$timeout(doRead, readTimeout);
                    } else {
                        hidapi.doingCommand = false;
                        return data;
                    }
                });
            };
            return hidapi.$timeout(function(){})
                .then(doRead);
        }, function(err) {
            return hidapi.close().then(function() {
                return hidapi.$q.reject(err);
            });
        });
    };

    HidAPI.prototype.makeCommand = function(prefix, protoBuf) {
        var tmpBuf = protoBuf.encode();
        var messageHex = tmpBuf.toString('hex');
        var txSizeHex = (messageHex.length / 2).toString(16);
        while (txSizeHex.length < 8) {
            txSizeHex = "0" + txSizeHex;
        }
        return prefix + txSizeHex + messageHex;
    };

    // commands to be called from outside this file

    HidAPI.prototype.ping = function() {
        return this._doCommand(this.commands.ping, this.TYPE_PONG);
    };

    HidAPI.prototype.listWallets = function() {
        return this._doCommand(this.commands.list_wallets, this.TYPE_WALLET_LIST);
    };

    HidAPI.prototype.getWalletCommand = function(type, walletNumber) {
        var cmd = this.commands[type + 'WalletPrefix'];
        var numHex = parseInt(walletNumber, 10).toString(16);
        if (numHex.length === 1) {
            numHex = '0' + numHex;
        }
        return cmd + numHex;
    };

    HidAPI.prototype.loadWallet = function(walletNumber) {
        var cmd = this.getWalletCommand('load', walletNumber);
        return this._doCommand(cmd, this.TYPE_SUCCESS);
    };

    HidAPI.prototype.deleteWallet = function(walletNumber) {
        var cmd = this.getWalletCommand('delete', walletNumber);
        return this._doCommand(cmd, this.TYPE_PLEASE_OTP);
    };

    HidAPI.prototype.format = function() {
        return this._doCommand(this.commands.format_storage, this.TYPE_PLEASE_OTP);
    };

    HidAPI.prototype.scanWallet = function() {
        return this._doCommand(this.commands.scan_wallet, this.TYPE_XPUB);
    };

    HidAPI.prototype.newWallet = function(walletNumber, options) {
        var Device = this.protoBuilder();
        // look through the options and fill in the data for the proto
        // buffer
        var protoData = {};
        if (options.isSecure) {
            var pass = new ByteBuffer();
            pass.writeUint8(0x74);
            pass.flip();
            protoData.password = pass;
        } else {
            protoData.password = null;
        }
        protoData.is_hidden = options.isHidden ? true : false;
        // get the name and put it in a byte buffer
        var name =  "Wallet " + walletNumber;
        if (options.name && 'string' === typeof name) {
            name = options.name;
        }
        var nameHex = this.hexUtil.toPaddedHex(name, 39) + '00';
        var nameBuf = this.hexUtil.hexToByteBuffer(nameHex);
        nameBuf.flip();
        protoData.wallet_name = nameBuf;
        // make a proto buffer for the data, generate a command and
        // send it off
        var newWalletMessage = new Device.NewWallet(protoData);
        // if isRestore === true in the option, use the restore command
        // instead (everything else is the same)
        var cmdPrefix = (options.isRestore === true) ?
            this.commands.restoreWalletPrefix : this.commands.newWalletPrefix;
        // now make a full command using the proto buffer
        var cmd = this.makeCommand(cmdPrefix, newWalletMessage);
        return this._doCommand(cmd);
    };

    // tx is from bitcoin/transaction.factory.js
    HidAPI.prototype.signTransaction = function(tx) {
        var hidapi = this;
        var deferred = this.$q.defer();
        var Device = this.protoBuilder();
        var addrHandlers = [];
        var inputData = [];
        async.eachSeries(tx.inputs, function(input, next) {
            // make a handler
            var handler = hidapi.makeAddressHandler(input.chain, input.chainIndex);
            // add to the handler array
            addrHandlers.push(handler);
            // get the hex of the full input transaction
            hidapi.getTxHex(input.tx_hash_big_endian).then(function(hex) {
                var thisInputData = '01';
                thisInputData += hidapi.hexUtil.intToBigEndianString(input.tx_output_n, 4);
                thisInputData += hex;
                inputData.push(thisInputData);
                return next();
            }, next);
        }, function(err) {
            if (err) {
                return deferred.reject(err);
            }
            var dataString = '00';
            dataString += tx.unsignedHex;
            // hash type
            dataString += '01000000';
            dataString = inputData.join('') + dataString;

            var dataBuf = hidapi.hexUtil.hexToByteBuffer(dataString);
            dataBuf.flip();
            var txMessage = new Device.SignTransactionExtended({
                address_handle_extended: addrHandlers,
                transaction_data: dataBuf
            });
            var cmd = hidapi.makeCommand(hidapi.commands.signTxPrefix, txMessage);
            console.debug("hidapi.TYPE_SIGNATURE_RETURN ", hidapi.TYPE_SIGNATURE_RETURN);
            hidapi._doCommand(cmd, hidapi.TYPE_SIGNATURE_RETURN).then(deferred.resolve, deferred.reject);
        });
        return deferred.promise;
    };

    var sigHeaders = [
        "-----BEGIN BITCOIN SIGNED MESSAGE-----",
        "-----BEGIN SIGNATURE-----",
        "-----END BITCOIN SIGNED MESSAGE-----"
    ];

    HidAPI.prototype.signMessage = function(address, chain, chainIndex, message) {
        var hidapi = this;
        var Device = hidapi.protoBuilder();
        var messageBytes = hidapi.messageUtil.makeMessageBytes(message);
        var messageHex = hidapi.hexUtil.bytesToHex(messageBytes);
        var msgBuf = hidapi.hexUtil.hexToByteBuffer(messageHex);
        msgBuf.flip();
        console.debug("signMessage: ", message, "->", messageBytes, "->", messageHex);
        var protoMsg = new Device.SignMessage({
            address_handle_extended: hidapi.makeAddressHandler(chain, chainIndex),
            message_data: msgBuf
        });
        var cmd = hidapi.makeCommand(hidapi.commands.signMessagePrefix, protoMsg);
        return hidapi._doCommand(cmd, hidapi.TYPE_MESSAGE_SIGNATURE).then(function(data) {
            var sig = hidapi.messageUtil.processSignature(message, address, data.payload);
            if (!sig) {
                return hidapi.$q.reject(new Error("Invalid signature returned"));
            }
            return ([
                sigHeaders[0],
                message,
                sigHeaders[1],
                address,
                sig,
                sigHeaders[2]
            ]).join('\n');
        });
    };

    HidAPI.prototype.makeAddressHandler = function(chain, chainIndex) {
        var handler = {
            address_handle_root: 0,
            address_handle_chain: chain,
            address_handle_index: chainIndex
        };

        if (chain === 'receive') {
            handler.address_handle_chain = this.RECEIVE_CHAIN;
        } else if (chain === 'change') {
            handler.address_handle_chain = this.CHANGE_CHAIN;
        } else {
            throw new Error("Invalid chain on input: " + chain);
        }

        return handler;
    };

    HidAPI.prototype.renameWallet = function(name) {
        var Device = this.protoBuilder();
        var nameHex = this.hexUtil.toPaddedHex(name, 39) + '00';
        console.debug(name, "->", nameHex);
        var nameBuf = this.hexUtil.hexToByteBuffer(nameHex);
        nameBuf.flip();
        // make a proto buffer for the data, generate a command and
        // send it off
        var newWalletMessage = new Device.ChangeWalletName({
            wallet_name: nameBuf
        });
        var cmd = this.makeCommand(this.commands.renameWalletPrefix, newWalletMessage);
        return this._doCommand(cmd);
    };

    HidAPI.prototype.sendOTP = function(otp) {
        var Device = this.protoBuilder();
        var otpMessage = new Device.OtpAck({
            otp: otp,
        });
        var cmd = this.makeCommand(this.commands.otpPrefix, otpMessage);
        return this._doCommand(cmd);
    };

    HidAPI.prototype.showQr = function(chainIndex) {
        var Device = this.protoBuilder();
        var otpMessage = new Device.DisplayAddressAsQR({
            address_handle_index: chainIndex,
        });
        var cmd = this.makeCommand(this.commands.qrPrefix, otpMessage);
        var hidapi = this;
        return hidapi.write(cmd).then(function(written) {
            if (written === 0) {
                return hidapi.$q.reject(new Error("No data written"));
            } else if (written === -1) {
                return hidapi.$q.reject(new Error("Write error"));
            }
        });
    };

    HidAPI.prototype.setChangeAddress = function(chainIndex) {
//     	console.debug("in setChangeAddress");
        var Device = this.protoBuilder();
        var otpMessage = new Device.SetChangeAddressIndex({
            address_handle_index: chainIndex,
        });
        var cmd = this.makeCommand(this.commands.setChangePrefix, otpMessage);
        var hidapi = this;
        return hidapi.write(cmd).then(function(written) {
            if (written === 0) {
                return hidapi.$q.reject(new Error("No data written"));
            } else if (written === -1) {
                return hidapi.$q.reject(new Error("Write error"));
            }
        });
    };



    HidAPI.prototype.flash = function() {
        var hidapi = this;
        var deferred = hidapi.$q.defer();
        hidapi.$timeout(function() {
            hidapi.device().hid_send_feature_report('01');
            deferred.resolve();
        });
        return deferred.promise;
    };

})(window, window.chrome, window.angular, window.async, window.dcodeIO.ProtoBuf, window.dcodeIO.ByteBuffer);
