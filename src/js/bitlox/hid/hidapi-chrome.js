(function(window, angular, chrome, async, ProtoBuf, ByteBuffer) {
    'use strict';

angular.module('hid')
    .service('bitloxHidChrome', [
    '$q', '$timeout', '$interval', '$rootScope',
    'Toast', 'hexUtil', 'txUtil', 'messageUtil',  'abconv',
    'VENDOR_ID', 'PRODUCT_ID', 'RECEIVE_CHAIN', 'CHANGE_CHAIN',
    'hidCommands', 'PROTO_STRING', 'platformInfo',
function HidApi($q, $timeout, $interval, $rootScope,
    Toast, hexUtil, txUtil, messageUtil, abconv,
    VENDOR_ID, PRODUCT_ID, RECEIVE_CHAIN, CHANGE_CHAIN,
    hidCommands, PROTO_STRING, platformInfo) {

    var HidApi = this;
    if(!platformInfo.isChromeApp) {
      return false;
    }
    this.VENDOR_ID = VENDOR_ID;
    this.PRODUCT_ID = PRODUCT_ID;
    this.RECEIVE_CHAIN = RECEIVE_CHAIN;
    this.CHANGE_CHAIN = CHANGE_CHAIN;
    this.PROTO_STRING = PROTO_STRING;
    this.Toast = Toast;
    this._plugin = null;
    this.version = null;
    this.path = null;
    this._device = null;
    this._builder = null;
    this.currentPromise = null;
    this.sessionId = null;
    this.sessionIdHex = null;
    this.sessionIdMatch = false;

    this.$q = $q;
    this.$timeout = $timeout;
    this.$interval = $interval;

    this.commands = hidCommands;


    this.hexUtil = hexUtil;
    this.abconv = abconv;
    this.messageUtil = messageUtil;
    this.getTxHex = txUtil.getHex;


    this.status = HidApi.STATUS_DISCONNECTED;


    // monitor disconnect
    chrome.hid.onDeviceRemoved.addListener(function() {
        console.debug("DEVICE REMOVED", status);
        
        if(status !== HidApi.STATUS_DISCONNECTED && status !== HidApi.STATUS_INITIALIZING) { $rootScope.$broadcast('bitloxConnectError'); }

        if(HidApi.currentPromise) { 
            console.log("rejecting promise after device removal")
            HidApi.currentPromise.reject(); 
        }
        HidApi.disconnect()

    });


    HidApi.TYPE_INITIALIZE         = 'initialize';
    HidApi.TYPE_PUBLIC_ADDRESS     = 'public address';
    HidApi.TYPE_ADDRESS_COUNT      = 'address count';
    HidApi.TYPE_WALLET_LIST        = 'wallet list';
    HidApi.TYPE_PONG               = 'pong';
    HidApi.TYPE_SUCCESS            = 'success';
    HidApi.TYPE_ERROR              = 'error';
    HidApi.TYPE_UUID               = 'uuid';
    HidApi.TYPE_SIGNATURE          = 'signature';
    HidApi.TYPE_PLEASE_ACK         = 'please ack';
    HidApi.TYPE_PLEASE_OTP         = 'please otp';
    HidApi.TYPE_XPUB               = 'xpub';
    HidApi.TYPE_SIGNATURE_RETURN   = 'signature return';
    HidApi.TYPE_MESSAGE_SIGNATURE  = 'message signature';

    HidApi.STATUS_DISCONNECTED     = "disconnected";
    HidApi.STATUS_CONNECTED        = "connected";
    HidApi.STATUS_CONNECTING       = "connecting";
    HidApi.STATUS_READING          = "reading";
    HidApi.STATUS_WRITING          = "writing";
    HidApi.STATUS_IDLE          = "idle";
    HidApi.STATUS_INITIALIZING          = "initializing";

    HidApi.getStatus = function() {
      return this.status;
    }
    HidApi.setStatus = function(status) {
        var self = this
        if(this.status !== status) { 
            $rootScope.$applyAsync(function() {
                self.status = status
            });
        }
    }
    // Get the device. If we already have it, just return it.
    // Otherwise, do a hidraw scan and find, then open, the device
    HidApi.device = function(force) {
        var HidApi = this;
        if (HidApi._device !== null) {
            return HidApi.$timeout(function() {
                return HidApi._device;
            }, 0);
        }
        HidApi.setStatus(HidApi.STATUS_CONNECTING);
        var deferred = HidApi.$q.defer();
        // console.debug("device: Getting HID devices");
        chrome.hid.getDevices({
            filters: [{
                vendorId: HidApi.VENDOR_ID,
                productId: HidApi.PRODUCT_ID
            }]
        }, function(devices) {
            if (chrome.runtime.lastError) {
                
                HidApi.setStatus(HidApi.STATUS_DISCONNECTED);
                
                console.error("device:", chrome.runtime.lastError);
                return deferred.reject(chrome.runtime.lastError);
            }
            if (!devices || !devices.length) {
                
                HidApi.setStatus(HidApi.STATUS_DISCONNECTED);
                
                // console.error("device: No devices");
                return deferred.reject(new Error("No devices"));
            }
            // console.debug("device: Got devices", devices);
            // console.debug("device: reportDescriptor",
                          // HidApi.abconv.ab2hex(devices[0].reportDescriptor));
            // console.debug("device: Connecting to device", devices[0].deviceId);
            chrome.hid.connect(devices[0].deviceId, function(connection) {
                if (chrome.runtime.lastError) {
                    
                    HidApi.setStatus(HidApi.STATUS_DISCONNECTED);
                    
                    console.error("device:", chrome.runtime.lastError);
                    return deferred.reject(chrome.runtime.lastError);
                }
                if (!connection) {
                    
                    HidApi.setStatus(HidApi.STATUS_DISCONNECTED);
                    

                    return deferred.reject(new Error("Failed to get connection"));
                }
                // console.debug("device: Got connection", connection);
                HidApi.setStatus(HidApi.STATUS_INITIALIZING);
                HidApi._device = connection.connectionId;
                deferred.resolve(HidApi._device);
            });
        });
        return deferred.promise;
    };

    HidApi.protoBuilder = function() {
        if (this._builder === null) {
            var builder = ProtoBuf.loadProto(this.PROTO_STRING);
            this._builder = builder.build();
        }
        return this._builder;
    };

    HidApi.chunkData = function(data, chunkSize) {
        if (chunkSize === undefined) {
            chunkSize = 2;
        }
        var chunks = data.match(new RegExp('.{1,' + chunkSize + '}', 'g'));
        var lastChunk = chunks[chunks.length - 1];
        if (lastChunk.length > chunkSize - 4) {
            var lastChunks = lastChunk.match(new RegExp('.{1,' + (chunkSize - 4) + '}', 'g'));
            chunks[chunks.length] = lastChunks[0];
            chunks.push(lastChunks[1]);
        }
        return chunks;
    };

    function pausecomp(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
        // console.debug("delay ", milliseconds);
    }

    HidApi.write = function(data) {
        var HidApi = this;
        var deferred = this.$q.defer();
        HidApi.setStatus(HidApi.STATUS_WRITING);
        console.debug("write:", data);
        HidApi.device().then(function(dev) {
            // get the device
            if (dev === null) {
                HidApi.disconnect();
                return this.$q.reject(new Error("No device to write to"));
            }
            HidApi.isWriting = true;
            // check remainder against 8 bytes and add 4 null bytes if we
            // have 0, 6, or 7 bytes of space left over
            var remainder = data.length % 16;
            if (remainder === 0 || remainder === 12 || remainder === 14) {
                data = '00000000' + data;
            }
            // split into 16 byte chunks
            var chunks = HidApi.chunkData(data, 64);
            // console.debug("write:", chunks.length, "chunks");
            // keep track of the total sent
            var totalSent = 0;
            async.eachSeries(chunks, function(thisData, next) {
                if (thisData.length) {
                    // if this is the final chunk, append the terminator
                    if (chunks.indexOf(thisData) + 1 === chunks.length) {
                        thisData += '7E7E';
                    }
                    // write to the device
                    var thisAb = HidApi.abconv.hex2abPad(thisData, 32);
//                     console.debug("write: writing", thisAb.byteLength, "bytes", thisData, HidApi.abconv.ab2hex(thisAb));
                    chrome.hid.send(dev, 0, thisAb, function() {
                        if (chrome.runtime.lastError) {
                            console.error("write error:", chrome.runtime.lastError);
                            return next(chrome.runtime.lastError);
                        }
//                         console.debug("write: wrote", thisAb.byteLength);
                        // add to the total sent
                        totalSent += thisAb.length;
                        // pausecomp(150);
                        return next();
                    });
                }
            }, function(err) {
                if (err) {
                    return deferred.reject(err);
                }
                // console.debug("write: finished");
                HidApi.isWriting = false;
                return deferred.resolve(totalSent);
            });
        }, deferred.reject);
        return deferred.promise;
    };

    var trimBeef = new RegExp('^(DEAD|BEEF|ADBEEF|EFDEAD)(DEAD|BEEF)+(2323)');


    HidApi.hidRead = function(size, timeout) {
        if (timeout === undefined) {
            timeout = 3000;
        }
        if (size === undefined) {
            size = 64;
        }
        var HidApi = this;
        this.currentPromise = this.$q.defer();
        HidApi.device().then(function(dev) {
            // console.debug("hidRead: doing read");
            chrome.hid.receive(dev, function(reportId, data) {
                if (chrome.runtime.lastError) {
                    return deferred.reject(chrome.runtime.lastError);
                }
                // console.debug("hidRead: reportId", reportId);
                var result = HidApi.abconv.ab2hex(data)
                    .replace(trimBeef, '$3');
                // console.debug("hidRead: RX", result);
                HidApi.currentPromise.resolve(result);
            });
        }, HidApi.currentPromise.reject);
        return this.currentPromise.promise;
    };

    var magic = '2323';
    var magicRegexp = new RegExp(magic);
    var magicRegexpEdge = new RegExp('BEEF(23){1,2}$');
    HidApi.read = function(serialData, wait) {
        HidApi.readErr = false;
        if (serialData === undefined) {
            serialData = '';
        }
        var HidApi = this;
//         console.debug("read: data so far", serialData);
        return this.hidRead().then(function(newData) {
            HidApi.isReading = true;
//             console.debug("reading");
            if (serialData===newData) {
                return HidApi.read(serialData, wait);
            }
            serialData = serialData + newData;
            if (magicRegexpEdge.test(serialData)) {
                return HidApi.read(serialData, wait);
            }

            // 			bonehead forgot to put in the edge split case
      			if (((serialData[60] !== 2) || (serialData[61] !== 3)) && ((serialData[62] === 2) && (serialData[63] === 3))) {
      			  //                     console.log('EDGE:' + sD);
		          serialData = serialData + HidApi.read(serialData, wait);
      			  //                     console.log('EDGE WRAP:' + sD);
      			}


            if (magicRegexp.test(serialData)) {
                // find the position of the magic string
                var headerPosition = serialData.search(magic);
                // if the header is close enough to the end that the
                // command and content length could be cut off, go ahead
                // and get more data
                if (headerPosition >= (serialData.length - (64 - 48))) {
                    return HidApi.read(serialData, wait);
                }
                // command is the 2 bytes after the magic
                var command = serialData.substring(headerPosition + 4, headerPosition + 8);
//                 if(command === "0023")
//                 {
//                 	return ;
//                 }
                // payload size is 4 bytes after command
                var payloadSize = serialData.substring(headerPosition + 8, headerPosition + 16);
                // parse the hex number to decimal
                var decPayloadSize = parseInt(payloadSize, 16);
//                 console.debug("decPayloadSize: ", decPayloadSize);
                if(command === "0034"||command === "0023"||command === "2323"||decPayloadSize === 2302720 ||decPayloadSize === 14942671)
                {
                	decPayloadSize = 0 ;
//                 	console.debug("decPayloadSize set to 0: ", decPayloadSize);
                }
                // if the content length is longer than the rest of the
                // data, go get some more
                if ((headerPosition + 16 + (2 * decPayloadSize)) > serialData.length) {
                    return HidApi.read(serialData, wait);
                }
                // the payload will start after 8 bytes
                var payload = serialData.substring(headerPosition + 16, headerPosition + 16 + (2 * (decPayloadSize)));
                return HidApi.processResults(command, payloadSize, payload);
            } else if (!wait && serialData === "") { //If nothing is detected, close down port
                console.warn("Device unplugged");
                HidApi.disconnect();
                return null;
            } else {
                return null;
            }
        },function(e) {
          console.warn("error in read", e)
          HidApi.readErr = true;
          HidApi.disconnect();
        }).finally(function() {
            if(!HidApi.readErr) { HidApi.setStatus(HidApi.STATUS_IDLE); }
        });
    };

    HidApi.processResults = function(command, length, payload) {
        var HidApi = this;
        var Device = this.protoBuilder();
        command = command.substring(2, 4);
        var data = {
            type: null,
            payload: {}
        };
        console.log(command, length, payload)

        switch (command) {
        case "3A": // initialize
            data.type = HidApi.TYPE_INITIALIZE;
            break;
        case "30": // public address
            data.type = HidApi.TYPE_PUBLIC_ADDRESS;
            data.payload.ecdsa = payload.substring(8, 74);
            data.payload.ripe160of2 = payload.substring(78, 118);
            break;
        case "31": // number of addresses in loaded wallet
            data.type = HidApi.TYPE_ADDRESS_COUNT;
            data.payload.count = payload.substring(2, 4);
            break;
        case "32": // Wallet list
            data.type = HidApi.TYPE_WALLET_LIST;
            data.payload.wallets = Device.Wallets.decodeHex(payload).wallet_info;
            break;
        case "33": // Ping response
            data.type = HidApi.TYPE_PONG;
            data.payload = Device.PingResponse.decodeHex(payload);
            break;
        case "34": // success
            data.type = HidApi.TYPE_SUCCESS;
            break;
        case "35": // general purpose error/cancel
            data.type = HidApi.TYPE_ERROR;
            var hidErr = Device.Failure.decodeHex(payload);
            data.payload = new Error(hidErr.error_message.toString('utf8'));
            console.debug(data.payload);
            data.payload.code = parseInt(hidErr.error_code, 10);
            console.debug("caught error");
            break;
        case "36": // device uuid return
            data.type = HidApi.TYPE_UUID;
            data.payload = Device.DeviceUUID.decodeHex(payload);
            break;
        case "39": // signature return [original]
            data.type = HidApi.TYPE_SIGNATURE;
            data.payload = Device.Signature.decodeHex(payload);
            break;
        case "50": // please ack
            data.type = HidApi.TYPE_PLEASE_ACK;
            break;
        case "56": // please otp
            data.type = HidApi.TYPE_PLEASE_OTP;
            break;
        case "62": // parse & insert xpub from current wallet //RETURN from scan wallet
            data.type = HidApi.TYPE_XPUB;
            data.payload = Device.CurrentWalletXPUB.decodeHex(payload);
            break;
        case "64": // signature return
            data.type = HidApi.TYPE_SIGNATURE_RETURN;
            var signedScripts = [];
            var sigs = Device.SignatureComplete.decodeHex(payload).signature_complete_data;
            console.log(sigs)
            sigs.forEach(function(sig) {
                var sigHex = sig.signature_data_complete.toString('hex');
                console.log('original sig', sigHex)
                var sigSize = parseInt(sigHex.slice(0, 2), 16);
                var sigChars = 2 + (sigSize * 2);
                sigHex = sigHex.slice(0, sigChars);
                console.log('sliced up sig', sigHex)
                signedScripts.push(sigHex);
            });
            data.payload = {
                signedScripts: signedScripts
            };
            break;
        case "71": // message signing return
            data.type = HidApi.TYPE_MESSAGE_SIGNATURE;
            var protoSig = Device.SignatureMessage.decodeHex(payload).signature_data_complete;
            data.payload = this.hexUtil.hexToBytes(protoSig.toString('hex'));
            break;
        default:
            data.type = HidApi.TYPE_ERROR;
            data.payload = new Error("Unknown command received: 00" + command);
            data.payload.code = 1;
            break;
        }
        return data;
    };
    HidApi.clearDevice = function() {

        HidApi._device = null;
        HidApi.sessionIdHex = null;
    }
    HidApi.disconnect = function() {
        HidApi.clearDevice();
        return HidApi.$timeout(function() {
            HidApi.setStatus(HidApi.STATUS_DISCONNECTED);
            // console.debug("closed");
        })
    };

    var readTimeout = 100;
    var counterMax = (120 * 1000) / readTimeout; // appx 2 minutes timeout

    HidApi._doCommand = function(command, expectedType, forcePing) {
        var HidApi = this;
        HidApi.doingCommand = true;
        if(!forcePing && !HidApi.sessionIdMatch 
            && command.indexOf(this.commands.ping) != 0 
            && command.indexOf(this.commands.initPrefix) != 0
            && command.indexOf(this.commands.scan_wallet) != 0) {
            return this._doCommand(this.commands.ping, this.TYPE_PONG).then(function(pingResult) {
                if(!pingResult) {
                    console.log("session id not found or ping failed")
                    return HidApi.$q.reject(new Error('BitLox session error. Try reconnecting the BitLox'))
                }
                var sessionIdHex = pingResult.payload.echoed_session_id.toString('hex')
                if(sessionIdHex !== HidApi.sessionIdHex) {
                    console.log("session id does not match")
                    HidApi.disconnect();
                    return HidApi.$q.reject(new Error('BitLox session expired. Try reconnecting the BitLox'))
                }
                HidApi.sessionIdMatch = true;
                return HidApi._doCommand(command, expectedType)
            })
        }

        return HidApi.write(command).then(function(written) {
            HidApi.sessionIdMatch = false;
            if (written === 0) {
                return HidApi.disconnect().then(function() {
                    return HidApi.$q.reject(new Error("No data written"));
                });
            } else if (written === -1) {
                return HidApi.disconnect().then(function() {
                    return HidApi.$q.reject(new Error("Write error"));
                });
            }
            var counter = 0;

            var doRead = function() {
                return HidApi.read('', 'wait please').then(function(data) {
                    counter += 1;
                    if (data === null) {
                        if (counter === counterMax) { // two minutes... ish
                            return HidApi.disconnect().then(function() {
                                return HidApi.$q.reject(new Error("Command response timeout"));
                            });
                        }
                        return HidApi.$timeout(doRead, readTimeout);
                    } else if (!data) {
                        HidApi.doingCommand = false;
                        return data;                        
                    }
                    if (data.type === HidApi.TYPE_PLEASE_ACK) {
                        return HidApi._doCommand(HidApi.commands.button_ack, expectedType);
                    } else if (expectedType) {
                        if (data.type === expectedType) {

                            if(data.type === HidApi.TYPE_INITIALIZE) {
                                HidApi.setStatus(HidApi.STATUS_CONNECTED);
                            }
                            // we got what we wanted, return it
                            HidApi.doingCommand = false;
                            return data;
                        } else {
                            HidApi.doingCommand = false;
                            return HidApi.$q.reject(new Error("Unexpected response from BitLox. If this problem persists, reset your BitLox"));
                        }

                        return HidApi.$timeout(doRead, readTimeout);
                    } else {
                        HidApi.doingCommand = false;
                        return data;
                    }
                });
            };
            return HidApi.$timeout(function(){})
                .then(doRead);
        }, function(err) {
            return HidApi.disconnect().then(function() {
                return HidApi.$q.reject(err);
            });
        });
    };

    HidApi.makeCommand = function(prefix, protoBuf) {
        var tmpBuf = protoBuf.encode();
        var messageHex = tmpBuf.toString('hex');
        var txSizeHex = (messageHex.length / 2).toString(16);
        while (txSizeHex.length < 8) {
            txSizeHex = "0" + txSizeHex;
        }
        return prefix + txSizeHex + messageHex;
    };

    // commands to be called from outside this file

    HidApi.ping = function() {
        return this._doCommand(this.commands.ping, this.TYPE_PONG, true);
    };
    HidApi.initialize = function(sessionId) {
        var Device = this.protoBuilder();
        this.sessionId = sessionId;
        var sessionIdHex = this.hexUtil.toPaddedHex(sessionId, 39) + '00';
        this.sessionIdHex = sessionIdHex;
        // console.debug(sessionId, "->", sessionIdHex);
        var sessionIdBuf = this.hexUtil.hexToByteBuffer(sessionIdHex);
        sessionIdBuf.flip();
        var sessionIdProtoBuf = new Device.Initialize({
            session_id: sessionIdBuf
        });
        var cmd = HidApi.makeCommand(HidApi.commands.initPrefix, sessionIdProtoBuf);
        return this._doCommand(cmd, this.TYPE_INITIALIZE);
    }; 
    HidApi.getDeviceUUID = function() {
        return this._doCommand(this.commands.get_device_uuid, this.TYPE_UUID);
    };

    HidApi.listWallets = function() {
        return this._doCommand(this.commands.list_wallets, this.TYPE_WALLET_LIST);
    };

    HidApi.getWalletCommand = function(type, walletNumber) {
        var cmd = this.commands[type + 'WalletPrefix'];
        var numHex = parseInt(walletNumber, 10).toString(16);
        if (numHex.length === 1) {
            numHex = '0' + numHex;
        }
        return cmd + numHex;
    };

    HidApi.loadWallet = function(walletNumber) {
        var cmd = this.getWalletCommand('load', walletNumber);
        return this._doCommand(cmd, this.TYPE_SUCCESS);
    };

    HidApi.deleteWallet = function(walletNumber) {
        var cmd = this.getWalletCommand('delete', walletNumber);
        return this._doCommand(cmd, this.TYPE_PLEASE_OTP);
    };

    HidApi.format = function() {
        return this._doCommand(this.commands.format_storage, this.TYPE_PLEASE_OTP);
    };

    HidApi.scanWallet = function() {
        return this._doCommand(this.commands.scan_wallet, this.TYPE_XPUB);
    };

    HidApi.newWallet = function(walletNumber, options) {
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
        // if isRestore === true in the option, use the restor command
        // instead (everything else is the same)
        var cmdPrefix = (options.isRestore === true) ?
            this.commands.restoreWalletPrefix : this.commands.newWalletPrefix;
        // now make a full command using the proto buffer
        var cmd = this.makeCommand(cmdPrefix, newWalletMessage);
        return this._doCommand(cmd);
    };

    // tx is from bitcoin/transaction.factory.js
    HidApi.signTransaction = function(opts) {
        var HidApi = this;
        var deferred = this.$q.defer();
        var Device = this.protoBuilder();
        var addrHandlers = [];
        var inputData = [];
        async.eachSeries(opts.bwsInputs, function(input, next) {
            // make a handler
          var inputPath = input.path.split('/')
            input.chain = parseInt(inputPath[1],10)
            input.chainIndex = parseInt(inputPath[2],10)

            console.log(inputPath)

            var handler = HidApi.makeAddressHandler(input.chain, input.chainIndex);
            // add to the handler array
            addrHandlers.push(handler);
            // get the hex of the full input transaction
            HidApi.getTxHex(input.txid).then(function(hex) {
                var thisInputData = '01';
                thisInputData += HidApi.hexUtil.intToBigEndianString(input.vout, 4);
                thisInputData += hex;
                inputData.push(thisInputData);
                return next();
            }, function(err) {
                return next(new Error('Unable to fetch transactions from server. Please contact support if this problem persists'));
            });
        }, function(err) {
            if (err) {
                return deferred.reject(err);
            }
            // console.log(inputData)

            var dataString = '00';
            dataString += opts.unsignedHex
            // console.warn("raw="+opts.unsignedHex)
            // hash type
            dataString += '01000000';
            dataString = inputData.join('') + dataString;

            var dataBuf = HidApi.hexUtil.hexToByteBuffer(dataString);
            // console.log(addrHandlers,dataBuf)
            dataBuf.flip();
            var txMessage = new Device.SignTransactionExtended({
                address_handle_extended: addrHandlers,
                transaction_data: dataBuf
            });
            var cmd = HidApi.makeCommand(HidApi.commands.signTxPrefix, txMessage);
            // console.log('sending')
            // console.log(cmd)
            HidApi._doCommand(cmd, HidApi.TYPE_SIGNATURE_RETURN).then(deferred.resolve, deferred.resolve);
        });
        return deferred.promise;
    };

    var sigHeaders = [
        "-----BEGIN BITCOIN SIGNED MESSAGE-----",
        "-----BEGIN SIGNATURE-----",
        "-----END BITCOIN SIGNED MESSAGE-----"
    ];

    HidApi.signMessage = function(address, chain, chainIndex, message) {
        var HidApi = this;
        var Device = HidApi.protoBuilder();
        var messageBytes = HidApi.messageUtil.makeMessageBytes(message);
        var messageHex = HidApi.hexUtil.bytesToHex(messageBytes);
        var msgBuf = HidApi.hexUtil.hexToByteBuffer(messageHex);
        msgBuf.flip();
        console.debug("signMessage: ", message, "->", messageBytes, "->", messageHex);
        var protoMsg = new Device.SignMessage({
            address_handle_extended: HidApi.makeAddressHandler(chain, chainIndex),
            message_data: msgBuf
        });
        var cmd = HidApi.makeCommand(HidApi.commands.signMessagePrefix, protoMsg);
        return HidApi._doCommand(cmd, HidApi.TYPE_MESSAGE_SIGNATURE).then(function(data) {
            var sig = HidApi.messageUtil.processSignature(message, address, data.payload);
            if (!sig) {
                return HidApi.$q.reject(new Error("Invalid signature returned"));
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

    HidApi.makeAddressHandler = function(chain, chainIndex) {
        var handler = {
            address_handle_root: 0,
            address_handle_chain: chain,
            address_handle_index: chainIndex
        };

        if (chain === 'receive' || chain === this.RECEIVE_CHAIN.toString() || chain === this.RECEIVE_CHAIN) {
            handler.address_handle_chain = this.RECEIVE_CHAIN;
        } else if (chain === 'change' || chain === this.CHANGE_CHAIN || chain === this.CHANGE_CHAIN) {
            handler.address_handle_chain = this.CHANGE_CHAIN;
        } else {
            throw new Error("Invalid chain on input: " + chain);
        }

        return handler;
    };

    HidApi.renameWallet = function(name) {
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

    HidApi.sendOTP = function(otp) {
        var Device = this.protoBuilder();
        var otpMessage = new Device.OtpAck({
            otp: otp,
        });
        var cmd = this.makeCommand(this.commands.otpPrefix, otpMessage);
        return this._doCommand(cmd);
    };

    HidApi.showQr = function(chainIndex) {
        var Device = this.protoBuilder();
        var otpMessage = new Device.DisplayAddressAsQR({
            address_handle_index: chainIndex,
        });
        var cmd = this.makeCommand(this.commands.qrPrefix, otpMessage);
        var HidApi = this;
        return HidApi.write(cmd).then(function(written) {
            if (written === 0) {
                return HidApi.$q.reject(new Error("No data written"));
            } else if (written === -1) {
                return HidApi.$q.reject(new Error("Write error"));
            }
        });
    };

    HidApi.setChangeAddress = function(chainIndex) {
    	// console.debug("in HidApi setChangeAddress",chainIndex,typeof(chainIndex));
        var Device = this.protoBuilder();
        var otpMessage = new Device.SetChangeAddressIndex({
            address_handle_index: parseInt(chainIndex,10),
        });
        var cmd = this.makeCommand(this.commands.setChangePrefix, otpMessage);
        return this._doCommand(cmd, this.TYPE_SUCCESS)
    };

    HidApi.flash = function() {
        var HidApi = this;
        var deferred = HidApi.$q.defer();
        HidApi.device().then(function(dev) {
            chrome.hid.sendFeatureReport(dev, 1, new ArrayBuffer(), function() {
                if (chrome.runtime.lastError) {
                    return deferred.reject(chrome.runtime.lastError);
                }
                return deferred.resolve();
            });
        });
        return deferred.promise;
    };

}]);
})(window, window.angular, window.chrome, window.async, window.dcodeIO.ProtoBuf, window.dcodeIO.ByteBuffer);
