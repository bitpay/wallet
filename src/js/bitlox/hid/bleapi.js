(function(window, angular, chrome, async, ProtoBuf, ByteBuffer, cordova, evothings, device) {
'use strict';


angular.module('hid')
.service('bitloxBleApi',
['$rootScope',
'$q',
'$timeout',
'$interval',
'hidCommands',
'hexUtil',
'txUtil',
'RECEIVE_CHAIN',
'CHANGE_CHAIN',
function BleApi($rootScope,$q,$timeout,$interval,hidCommands, hexUtil, txUtil, RECEIVE_CHAIN, CHANGE_CHAIN) {
var BleApi = this
var deviceCommands = hidCommands;

// Handles to characteristics and descriptor for reading and
// writing data from/to the Arduino using the BLE shield.
this.characteristicRead = null;
this.characteristicWrite = null;
this.descriptorNotification = null;
this.pinTheFirst = 0;
this.pinFirstDecline = 0;
this.characteristicName = null;
this.deviceHandle = null;
this.hexUtil = hexUtil;

BleApi.STATUS_SCANNING     = "scanning";
BleApi.STATUS_DISCONNECTED  = "disconnected";
BleApi.STATUS_CONNECTED        = "connected";
BleApi.STATUS_CONNECTING       = "connecting";
BleApi.STATUS_READING          = "reading";
BleApi.STATUS_WRITING          = "writing";
BleApi.STATUS_IDLE         = "idle";
BleApi.STATUS_INITIALIZING          = "initializing";


BleApi.TYPE_INITIALIZE          = 'initialize';
BleApi.TYPE_PUBLIC_ADDRESS     =  'public address';
BleApi.TYPE_ADDRESS_COUNT      =  'address count';
BleApi.TYPE_WALLET_LIST        =  'wallet list';
BleApi.TYPE_PONG               =  'pong';
BleApi.TYPE_SUCCESS            =  'success';
BleApi.TYPE_ERROR              =  'error';
BleApi.TYPE_UUID               =  'uuid';
BleApi.TYPE_SIGNATURE          =  'signature';
BleApi.TYPE_PLEASE_ACK         =  'please ack';
BleApi.TYPE_PLEASE_OTP         =  'please otp';
BleApi.TYPE_XPUB               =  'xpub';
BleApi.TYPE_SIGNATURE_RETURN   =  'signature return';
BleApi.TYPE_MESSAGE_SIGNATURE  =  'message signature';
BleApi.TYPE_ENTROPY_RETURN  =  'entropy return';


BleApi.RECEIVE_CHAIN = RECEIVE_CHAIN
BleApi.CHANGE_CHAIN = CHANGE_CHAIN
/*
 * The BLE plugin is loaded asynchronously so the ble
 * variable is set in the onDeviceReady handler.
 */

var appVersion = "2.1.16";
  // "globals"
var bleReady = null,
  knownDevices = {},
  status = BleApi.STATUS_DISCONNECTED,
  currentCommand = null,
  platform = null,
  protoDevice = null,
  errCommandInProgress = $q.reject(new Error("command already in progress"))

BleApi.currentPromise = null;
BleApi.timeout = $timeout(function() {},0)
BleApi.sessionId = null;
BleApi.sessionIdHex = null;
var incomingData = '';
var dataAlmostReady = false;
var dataReady = false;
var payloadSize = 0;
var	vibrationEnabled = true;
var scriptsToReplace = [];
var BulkString;
var incoming = '';
var prevsD = '';
var plugin;
var result;
var path;
var deviceUnplugged = false;
var deviceOpen = false;
var edge = false;
var globalPINstatus = null;
var pinTheFirst = '';
var readyToggle = false;
var displayMode = '';
var indexToBeUsedToSend = '';
var tempTXglobal = '';

var baseUrl = 'https://bitlox.io/api';


var serverURL = 'https://insight.bitpay.com/api';
var serverURLio = 'http://bitlox.io/api';
// 	        http://bitlox.io/api/addr/17XLaSzT7ZpzEJmFvnqEFycoEUXDaXkPcp/totalReceived',{}, 'text')




/********************
*	Utility functions
*/

function pausecomp(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}


String.prototype.chunk = function(n) {
    if (typeof n == 'undefined') n = 2;
    return this.match(RegExp('.{1,' + n + '}', 'g'));
};

var padding = Array(64).join('0');


// 	Now with padding to ensure the full two character hex is returned
function d2h(d) {
	var padding = 2;
    var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

while (hex.length < padding) {
	hex = "0" + hex;
}
return hex;
}

function h2d(h) {
    return parseInt(h, 16);
}

function toHex(str) {
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

function toHexPadded40bytes(str) {
    var hex = '';
    var targetlength = 40;
var bytes;
    if (str.length <= targetlength) {
        length = str.length;
    }
hex = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(str));
    while (hex.length < (targetlength*2)) {
        hex += '20';
    }
    return hex;
}

function toHexUTF8(str) {
    var hex = '';
hex = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(str));
    return hex;
}

function hex2a(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

/*************************
*	Utility functions END
*/
BleApi.getBleReady = function() {
  return bleReady;
}
BleApi.getKnownDevices = function() {
  return knownDevices;
}
BleApi.getNumDevices = function() {
  return Object.keys(knownDevices).length
}
BleApi.getStatus = function() {
  return status;
}
BleApi.getCurrentResponseData = function() {
  return status;
}
this.makeCommand = function(prefix, protoBuf) {
    var tmpBuf = protoBuf.encode();
    var messageHex = tmpBuf.toString('hex');
    var txSizeHex = (messageHex.length / 2).toString(16);
    while (txSizeHex.length < 8) {
        txSizeHex = "0" + txSizeHex;
    }
    return prefix + txSizeHex + messageHex;
};

this.getDeviceUUID = function() {
  currentCommand = 'getDeviceUUID'
  return this.write(deviceCommands.get_device_uuid);
}
////////////////////////////
// New wallet
//
// Responses: Success or Failure
// Response interjections: ButtonRequest
// wallet_name is stored purely for the convenience of the host. It should be
// a null-terminated UTF-8 encoded string with a maximum length of 40 bytes.
// To create an unencrypted wallet, exclude password.
// message NewWallet
// {
// 	optional uint32 wallet_number = 1 ;//[default = 0];
// 	optional bytes password = 2;
// 	optional bytes wallet_name = 3;
// 	optional bool is_hidden = 4 ;//[default = false];
// }
////////////////////////////
this.setChangeAddress = function(changeIndex) {
  currentCommand = 'setChangeAddress'
  var msg = new protoDevice.SetChangeAddressIndex({
    "address_handle_index": parseInt(changeIndex,10)
  });
  var cmd = this.makeCommand(deviceCommands.setChangePrefix, msg);
  return this.write(cmd);
}
this.newWallet = function(walletNumber, options) {
  currentCommand = "newWallet"
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
  var nameHex = BleApi.hexUtil.toPaddedHex(name, 39) + '00';
  var nameBuf = BleApi.hexUtil.hexToByteBuffer(nameHex);
  nameBuf.flip();
  protoData.wallet_name = nameBuf;
  // make a proto buffer for the data, generate a command and
  // send it off
  var newWalletMessage = new protoDevice.NewWallet(protoData);
  // console.warn(JSON.stringify(protoData))
  // if isRestore === true in the option, use the restor command
  // instead (everything else is the same)
  var cmdPrefix = (options.isRestore === true) ?
      deviceCommands.restoreWalletPrefix : deviceCommands.newWalletPrefix;
  // now make a full command using the proto buffer
  var cmd = this.makeCommand(cmdPrefix, newWalletMessage);
  return this.write(cmd,900000);
};

/**
*	Initialize device
*	parameters: none
*	sends a ~random number as a session id. This random number is echoed in any
*	subsequent ping requests as a method of ensuring the device has not been reset in the middle of
*	a session. Unloads all wallets & clears memory.
*/
this.initialize_protobuf_encode = function() {
	var randomnumber= d2h(Math.floor(Math.random()*1000000001));
  console.log("randomnumber: " + randomnumber);

	var bb = new ByteBuffer();
  var parseLength = randomnumber.length
  // 	console.log("utx length = " + parseLength);
  var i;
  for (i = 0; i < parseLength; i += 2) {
    var value = randomnumber.substring(i, i + 2);
    // 	console.log("value = " + value);
    var prefix = "0x";
    var together = prefix.concat(value);
    // 	console.log("together = " + together);
    var result = parseInt(together);
    // 	console.log("result = " + result);

    bb.writeUint8(result);
  }
  bb.flip();

  var msg = new protoDevice.Initialize({
      "session_id": bb,
  });
  var tempTXstring = BleApi.makeCommand("0017",msg)

  this.write(tempTXstring);
}
this.deleteWallet = function(walletNumber) {
    var cmd = this.getWalletCommand('delete', walletNumber);
    return this.write(cmd);
};

this.getWalletCommand = function(type, walletNumber) {
    var cmd = deviceCommands[type + 'WalletPrefix'];
    var numHex = parseInt(walletNumber, 10).toString(16);
    if (numHex.length === 1) {
        numHex = '0' + numHex;
    }
    return cmd + numHex;
};
this.makeAddressHandler = function(chain, chainIndex) {
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

////////////////////////////
// Sign Transaction Prep
////////////////////////////
// tx is from bitcoin/transaction.factory.js
this.signTransaction = function(opts) {
    var addrHandlers = [];
    var inputData = [];
    var deferred = $q.defer()
    async.eachSeries(opts.bwsInputs, function(input, next) {
        var inputPath = input.path.split('/')
        input.chain = parseInt(inputPath[1],10)
        input.chainIndex = parseInt(inputPath[2],10)

        // make a handler
        var handler = BleApi.makeAddressHandler(input.chain, input.chainIndex);
        // add to the handler array
        addrHandlers.push(handler);
        // get the hex of the full input transaction
        txUtil.getHex(input.txid).then(function(hex) {
            var thisInputData = '01';
            var vout = BleApi.hexUtil.intToBigEndianString(input.vout, 4);
            thisInputData += vout
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

        var dataString = '00';
            dataString += opts.unsignedHex
            // console.warn("raw="+opts.unsignedHex)        // hash type
        dataString += '01000000';
        dataString = inputData.join('') + dataString;

        var dataBuf = BleApi.hexUtil.hexToByteBuffer(dataString);
        dataBuf.flip();
        var msg = new protoDevice.SignTransactionExtended({
            address_handle_extended: addrHandlers,
            transaction_data: dataBuf
        });
        var cmd = BleApi.makeCommand(deviceCommands.signTxPrefix, msg);
        // console.warn('sending something')
        // console.warn(cmd)
        return BleApi.write(cmd, 900000).then(function(res) {
          return deferred.resolve(res)
        },function(e) {
          return deferred.resolve(e)
        })
    });
    return deferred.promise
};

this.signTransactionOld = function(unsignedtx, originatingTransactionArray, originatingTransactionArrayIndices, address_handle_chain, address_handle_index) {
  var numberOfInputsinArray = originatingTransactionArray.length;
  console.log("numberOfInputsinArray: " + numberOfInputsinArray);

  var m;
  for(m = 0; m < numberOfInputsinArray; m++) {
    console.log("Originating Transaction "+m+": " + originatingTransactionArray[m]);
  }

  var address_handle_root = [];
  for(m = 0; m < numberOfInputsinArray; m++) {
    address_handle_root[m] = 0;
  }

  var address_handle_extended_data = []; // empty array
  var k;
  for (k=0;k<numberOfInputsinArray;k++)
  {
    address_handle_extended_data.push({
    address_handle_root: address_handle_root[k],
    address_handle_chain: address_handle_chain[k],
    address_handle_index: address_handle_index[k]});
  }
  console.log(JSON.stringify(address_handle_extended_data));

  // INPUTS
  var inputHexTemp = "";
  var j;
  for (j=0; j<numberOfInputsinArray; j++){
    //         wrapper:
    var tempOriginating = "";
    var is_ref01 = "01";
    var output_num_select = valueFromInteger(originatingTransactionArrayIndices[j]);
    //         previous transaction data:
    output_num_select = Crypto.util.bytesToHex(output_num_select);
    console.log("output_num_select: " + j +" : "+ output_num_select);
    tempOriginating = is_ref01.concat(output_num_select);
    tempOriginating = tempOriginating.concat(originatingTransactionArray[j]);
    inputHexTemp = inputHexTemp.concat(tempOriginating);
  }
  // END INPUTS
  var tempBuffer = ByteBuffer.allocate(1024);
  // OUTPUTS
  var is_ref00 = "00";
  unsignedtx = is_ref00.concat(unsignedtx);
  console.log("utx = " + unsignedtx);
  var hashtype = "01000000";
  unsignedtx = unsignedtx.concat(hashtype);

  unsignedtx = inputHexTemp.concat(unsignedtx);

  var sizeOfInput =  unsignedtx.length;
  console.log("sizeOfInput = " + sizeOfInput);

  var bb = ByteBuffer.allocate((sizeOfInput/2)+64);

  var i;
  for (i = 0; i < sizeOfInput; i += 2) {
    var value = unsignedtx.substring(i, i + 2);
    // 		console.log("value = " + value);
    var prefix = "0x";
    var together = prefix.concat(value);
    // 		console.log("together = " + together);
    var result = parseInt(together);
    // 		console.log("result = " + result);

    bb.writeUint8(result);
  }
  bb.flip();
  // END OUTPUTS

  for(m = 0; m < numberOfInputsinArray; m++) {
    console.log("address_handle_root["+m+"]" + address_handle_root[m]);
    console.log("address_handle_chain["+m+"]" + address_handle_chain[m]);
    console.log("address_handle_index["+m+"]" + address_handle_index[m]);
  }

  var txContents = new protoDevice.SignTransactionExtended({
  	"address_handle_extended": address_handle_extended_data
  	,
      "transaction_data": bb
  });
  // 		console.log("txContents: " + JSON.stringify(txContents));

  tempBuffer = txContents.encode()
  var tempTXstring = tempBuffer.toString('hex');
  //         document.getElementById("temp_results").innerHTML = tempTXstring;
  txSize = d2h((tempTXstring.length) / 2).toString('hex');
  // 	console.log("txSize = " + txSize);
  // 	console.log("txSize.length = " + txSize.length);
  var j;
  var txLengthOriginal = txSize.length;
  for (j = 0; j < (8 - txLengthOriginal); j++) {
    var prefix = "0";
    txSize = prefix.concat(txSize);
  }
  // 	console.log("txSizePadded = " + txSize);
  tempTXstring = txSize.concat(tempTXstring);

  var command = "0065"; // extended
  tempTXstring = command.concat(tempTXstring);

  var magic = "2323"
  tempTXstring = magic.concat(tempTXstring);

  if(currentCommand == 'signAndSend')
  {
  	tempTXglobal = tempTXstring;
  	setChangeAddress(usechange);
  //         	BleApi.app.sliceAndWrite64(tempTXglobal);
  } else {
    document.getElementById("device_signed_transaction").value = tempTXstring;
    $("#sign_transaction_with_device").attr('disabled',false);
    console.log("READY");
    BleApi.displayStatus('About to set change');
    setChangeAddress(usechange);
    BleApi.displayStatus('Ready to sign');
  }
}

this.genTransaction = function(txp) {

  // prepare inputs
  var fullInputTransactionHash = [];
  var fullInputTXindex = [];
  var address_handle_chain = [];
  var address_handle_index = [];
  // 				var scriptsToReplace = [];

  // var incoin = [];
  // for (var k in unspent) {
  //   var u = unspent[k];
  //   for (var i = 0; i < u.length; i++) {
  //     var ui = u[i]
  //     var coin = {
  //         "hash": ui.txid,
  //         "age": ui.confirmations,
  //         "address": k,
  //         "coin": ui,
  //         "chain": ui.chain,
  //         "index": ui.index
  //     };
		// 	console.log("address: " + coin.address);
  //     //             			console.log("coin: " + coin.coin);
		// 	console.log("chain: " + coin.chain);
		// 	console.log("index: " + coin.index);
  //     incoin.push(coin);
  //   }
  // }
  // var sortcoin = _.sortBy(incoin, function(c) {
  //     return c.age;
  // });

  // inamount = 0;
  var tx = new Bitcoin.Transaction();

  var toaddr = new Bitcoin.Address(receiver);
  var to = new Bitcoin.TransactionOut({
      value: valueFromSatoshi(amount),
      script: Bitcoin.Script.createOutputScript(toaddr)
  });
  tx.addOutput(to);
  // add in the hooks to the + button here

  var usedkeys = [];
  for (var i = 0; i < txp.inputs.length; i++) {
    var coin = txp.inputs[i];
    var tin = new Bitcoin.TransactionIn({
        outpoint: {
            hash: Bitcoin.Util.bytesToBase64(Bitcoin.Util.hexToBytes(coin.txid).reverse()), //  .reverse()!
            index: coin.vout
        },
        script: Bitcoin.Util.hexToBytes(coin.scriptPubKey),
        seroverluence: 4294967295
    });
    scriptsToReplace[i] = coin.scriptPubKey;
    fullInputTransactionHash[i] = Bitcoin.Util.bytesToHex(Bitcoin.Util.hexToBytes(coin.txid));  // no .reverse()!
    //             		alert("fullInputTransactionHash[" + i + "]: " + fullInputTransactionHash[i]);
    fullInputTXindex[i] = coin.vout;
    // address_handle_chain[i] = coin.chain;
    // address_handle_index[i] = coin.index;

    tx.addInput(tin);
    // usedkeys.push(sortcoin[i].address);
  }

  if (inamount > target) {
    //                 ROLLING
      var changeaddr = chains['change'].derive_child(usechange).eckey.getBitcoinAddress();
      //                     var changeaddr = chains['receive'].derive_child(0).eckey.getBitcoinAddress();
      var ch = new Bitcoin.TransactionOut({
          value: valueFromSatoshi(inamount - target),
          script: Bitcoin.Script.createOutputScript(changeaddr)
      });
      tx.addOutput(ch);
  }
  // tx.signWithKey(inchain[k].eckey);
  // if (key.has_private_key) {
  //     for (var i = 0; i < usedkeys.length; i++) {
  //         k = usedkeys[i];
  //         var inchain = null;
  //         if (k in addresses['receive']) {
  //             inchain = addresses['receive'];
  //         } else if (k in addresses['change']) {
  //             inchain = addresses['change'];
  //         }
  //         if (inchain) {
  //             tx.signWithKey(inchain[k].eckey);
  //         } else {
  //             console.log("Don't know about all the keys needed.");
  //         }
  //     }
  //     $("#signedtxlabel").show()
  //     $("#unsignedtxlabel").hide()
  //     $("#submit_signed_transaction").removeAttr('disabled');
  // } else {
  //     $("#unsignedtxlabel").show()
  //     $("#signedtxlabel").hide()
  //     $("#preptxlabel").show()

  //     $("#submit_signed_transaction").attr('disabled', true);
  // }
  var unsignedTransactionToBeCoded = Bitcoin.Util.bytesToHex(tx.serialize());
  var fullInputTXHex = [];
  var how_many_inputs = fullInputTXindex.length;
  var mCounter = 0;
    //                 alert("fullInputTXindex.length: " + how_many_inputs);

// _.eachSeries(fullInputTransactionHash, function(val, i){
//     // 					alert("in each: " + i + " " + val);

//    $.get(baseUrl + '/rawtx/' + val)
// 			.done
// 			(
// 				function(data)
// 					{
//             // 									alert(data.rawtx);
//             // 									console.log("in each done: "  + data.rawtx + " i:" + i);
// 						fullInputTXHex[i] = data.rawtx;
// 						mCounter++;
// 						if(mCounter == how_many_inputs){prepForSigning(unsignedTransactionToBeCoded, fullInputTXHex, fullInputTXindex, address_handle_chain, address_handle_index)}
// 					}
// 			)
// 			.fail
// 			(
// 				function()
// 					{
// 						alert("failed to fetch data");
// 					}
// 			)
// 		} // end each function
// 	) // end each
//   console.log("fullInputTXindex: " + fullInputTXindex);
//   console.log("unsignedTransactionToBeCoded: " + unsignedTransactionToBeCoded);
// 	for(m=0; m < how_many_inputs; m++) {
//           console.log("scripts to replace: " + scriptsToReplace[m]);
// 	}
  return tx;

}
this.scanWallet = function() {
  currentCommand = 'scanWallet'
  return this.write(deviceCommands.scan_wallet);
}
this.listWallets = function() {
  currentCommand = 'listWallets'
  return this.write(deviceCommands.list_wallets);
}

this.loadWallet = function(num) {
  currentCommand = 'loadWallet'
  var cmd = this.getWalletCommand('load', num);
  return this.write(cmd, 300000)
}
this.initialize = function(sessionId) {
  currentCommand = 'initialize'
  var sessionIdHex = BleApi.hexUtil.toPaddedHex(sessionId, 39) + '00';
  this.sessionIdHex = sessionIdHex;
  // console.debug(sessionId, "->", sessionIdHex);
  var sessionIdBuf = BleApi.hexUtil.hexToByteBuffer(sessionIdHex);
  sessionIdBuf.flip();
  var msg = new protoDevice.Initialize({
      session_id: sessionIdBuf
  });

  var cmd = BleApi.makeCommand(deviceCommands.initPrefix,msg)
  return this.write(cmd, 15000)
}
this.ping = function(args) {
  currentCommand = 'ping'
  var msg = new protoDevice.Ping(args);
  var tempTXstring = BleApi.makeCommand("0000",msg)
  return this.write(tempTXstring)
}
/**
*	Returns entropy generated by the device
*	Could be useful for forensic tests of the "randomness" of the entropy generated
*	Ref: http://www.shannonentropy.netmark.pl
*
*	parameters: entropy_amount, bytes of entropy to return
*/
this.getEntropy = function(entropy_amount) {
  currentCommand = 'getEntropy'
  var entropyToGet = Number(entropy_amount);
  var msg = new protoDevice.GetEntropy({
	     "number_of_bytes": entropyToGet
  });
  var tempTXstring = BleApi.makeCommand("0014",msg)
  return this.write(tempTXstring)
}
this.constructTxString = function(pinAckMessage,command) {
  var tempBuffer = pinAckMessage.encode();
  var tempTXstring = tempBuffer.toString('hex');
  var txSize = d2h((tempTXstring.length) / 2).toString('hex');
  // console.log("tempTXstring = " + tempTXstring);

  var j;
  var txLengthOriginal = txSize.length;
  for (j = 0; j < (8 - txLengthOriginal); j++) {
      var prefix = "0";
      txSize = prefix.concat(txSize);
  }
  tempTXstring = txSize.concat(tempTXstring);

  tempTXstring = command.concat(tempTXstring);

  var magic = "2323"
  tempTXstring = magic.concat(tempTXstring);
  console.log("tempTXstring = " + tempTXstring);
  return tempTXstring;
}

this.stopScan = function() {
	evothings.ble.stopScan();
}

this.initializeBle = function() {
	document.addEventListener(
		'deviceready',
    function() {
      // if we've already initialized don't do it again
      if(bleReady) {
        console.log("BLE PREVIOUSLY INITIALISED, STARTING NEW SESSION", status)
        
        // $rootScope.$applyAsync(function() {
        //   status = BleApi.STATUS_DISCONNECTED
        // })        
        return true;
      }
      platform = window.device.platform.toLowerCase()
      BleApi.initProtoBuf(function(err, device) {
        if(err) {
          console.error("ProtoBuf Failed to Load Messages File")
          console.error(err)
        }
        protoDevice = device
        bleReady = true;
      })
    },false);
}
this.initProtoBuf = function(cb) {
  var ProtoBuf = dcodeIO.ProtoBuf;
  var ByteBuffer = dcodeIO.ByteBuffer;

  // var path_prefix = platform === 'android' ? "file:///android_asset/" : cordova.file.applicationStorageDirectory
  // var pathToProto = path_prefix+"www/proto/messages.proto";
  var path_prefix = platform === 'android' ? "file:///android_asset/www/" : ""

  var pathToProto = path_prefix+"proto/messages.proto";
  // console.log(pathToProto)
  ProtoBuf.loadProtoFile(pathToProto, function(err, builder) {
    if(err) {
      console.error("load protofile error")
      console.error(err)
      return cb(err)
    }
    var Device = builder.build();
    return cb(null, Device)
  });
}
this.displayStatus = function(newStatus) {
  if(status !== newStatus) {
    console.log('Status: '+status);
  }
}
this.getServices = function() {
  var bleapi = this

	BleApi.displayStatus('Reading services...');

	evothings.ble.readAllServiceData(BleApi.deviceHandle, function(services)
	{
		// Find handles for characteristics and descriptor needed.
		for (var si in services)
		{
			var service = services[si];
      for (var ci in service.characteristics)
			{
				var characteristic = service.characteristics[ci];

				if (characteristic.uuid == '0000ffe4-0000-1000-8000-00805f9b34fb')
				{
          BleApi.characteristicRead = evothings.ble.getCharacteristic(service, characteristic.uuid)
					// BleApi.characteristicRead = characteristic.handle;
				}
				else if (characteristic.uuid == '0000ffe9-0000-1000-8000-00805f9b34fb')
				{
          BleApi.characteristicWrite = evothings.ble.getCharacteristic(service, characteristic.uuid)

					// BleApi.characteristicWrite = characteristic.handle;
				}
				else if (characteristic.uuid == '0000ff91-0000-1000-8000-00805f9b34fb')
				{
          BleApi.characteristicName = evothings.ble.getCharacteristic(service, characteristic.uuid)

					// BleApi.characteristicName = characteristic.handle;
				}

				for (var di in characteristic.descriptors)
				{
					var descriptor = characteristic.descriptors[di];

					if (characteristic.uuid == '0000ffe4-0000-1000-8000-00805f9b34fb' &&
						descriptor.uuid == '00002902-0000-1000-8000-00805f9b34fb')
					{
						BleApi.descriptorNotification = descriptor.handle;
					}
					if (characteristic.uuid == '0000ff91-0000-1000-8000-00805f9b34fb' &&
						descriptor.uuid == '00002901-0000-1000-8000-00805f9b34fb')
					{
						BleApi.descriptorName = descriptor.handle;
					}
				}
			}
		}

		if (BleApi.characteristicRead && BleApi.characteristicWrite && BleApi.descriptorNotification && BleApi.characteristicName && BleApi.descriptorName)
		{
      BleApi.displayStatus('RX/TX services found!');
			BleApi.startReading();
		}
		else
		{
			BleApi.displayStatus('ERROR: RX/TX services not found!');
		}
	},
	function(errorCode)
	{
		BleApi.displayStatus('readAllServiceData error: ' + errorCode);
	});
}

/**
* 	Reads the datastream after subscribing to notifications.
* 	Bytes are read off one at a time and assembled into a frame which is then passed to
* 	be processed. The passed frame may not contain the whole message, which will be completed
* 	in subsequent frames. Android needs a shim of ~10 ms to properly keep up.
*/
this.startReading = function() {
  var bleapi = this
	BleApi.displayStatus('Enabling notifications...');

	var sD = '';
	// console.log('data at beginning: ' + sD);

	// Turn notifications on.
	BleApi.bleWrite(
		'writeDescriptor',
		BleApi.deviceHandle,
		BleApi.descriptorNotification,
		new Uint8Array([1,0]), function() {
      // Start reading notifications.
      evothings.ble.enableNotification(
        BleApi.deviceHandle,
        BleApi.characteristicRead,
        function(data) {
          // BleApi.displayStatus('Active');
          var buf = new Uint8Array(data);
          for (var i = 0 ; i < buf.length; i++)
          {
            sD = sD.concat(d2h(buf[i]).toString('hex'));
          };

          // console.log('data semifinal: ' + sD);
          for (var i = 0 ; i < buf.length; i++)
          {
            buf[i] = 0;
          };
          BleApi.sendToProcess(sD);
          sD = '';
          // if(platform == "android")
          // {
          //   pausecomp(20);
          // }

        },
        function(errorCode) {
          BleApi.displayStatus('enableNotification error: ' + errorCode);
          BleApi.disconnect();
        });
      BleApi.displayStatus('BLE device connected and ready for communications');
      // pausecomp(1000)
      $timeout.cancel(BleApi.timeout)
      $rootScope.$applyAsync(function() {
        status = BleApi.STATUS_INITIALIZING
      });
      BleApi.currentPromise.resolve()
    });
}

// 	Actual write function
this.bleWrite = function(writeFunc, deviceHandle, handle, value, cb) {
  if (handle)
  {
    evothings.ble[writeFunc](
      deviceHandle,
      handle,
      value,
      function()
      {
      // 					alert(writeFunc + ': ' + handle + ' success.');
        console.log(writeFunc + ': ' + JSON.stringify(handle) + ' success.');
        if(cb) cb();
      },
      function(errorCode)
      {
          // 					alert(writeFunc + ': ' + handle + ' error: ' + errorCode);

        console.log(writeFunc + ': ' + JSON.stringify(handle) + ' error: ' + errorCode);
        if(cb) cb(new Error(writeFunc + ': ' + JSON.stringify(handle) + ' error: ' + errorCode));
      });
  }
}

this.startScanNew = function() {
  var bleapi = this
  evothings.ble.stopScan();
	this.displayStatus('Scanning...');
	evothings.ble.startScan(
		function(device)
		{
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			if (device.rssi <= 0)
			{
				BleApi.deviceFound(device, null);
			}
		},
		function(errorCode)
		{
      console.error("BITLOX BLE SCAN ERROR", errorCode)
			// Report error.
			BleApi.deviceFound(null, errorCode);
		}
	);
}

this.deviceFound = function(device, errorCode)  {
  // console.log(JSON.stringify(device.advertisementData))
	if (device && device.advertisementData.kCBAdvDataServiceUUIDs
    && device.advertisementData.kCBAdvDataServiceUUIDs.indexOf('0000fff0-0000-1000-8000-00805f9b34fb') > -1) {
	// if (device){
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();
		// Insert the device into table of found devices

    $rootScope.$applyAsync(function() {
      knownDevices[device.address] = device;
    })
    //this next line goes nuts in logcat. use wisely
    // console.warn("BITLOX FOUND A BLE DEVICE: "+ JSON.stringify( knownDevices[device.address].address));
	}
	else if (errorCode)
	{
    knownDevices = {};
		this.displayStatus('Scan Error: ' + errorCode);
	}
}
this.connect = function(address)	{
  var bleapi = this
  // if(platform === 'android') pausecomp(1000);
  if(status === BleApi.STATUS_CONNECTING) {
    console.log('rejecting additional calls to BLE connect function')
    return $q.reject(new Error("Already connecting"));
  }
  $rootScope.$applyAsync(function() {
    status = BleApi.STATUS_CONNECTING
  });  
  this.timeout = $timeout(function() {
    
    if(status !== BleApi.STATUS_DISCONNECTED && status !== BleApi.STATUS_INITIALIZING) {     
      BleApi.disconnect();
      $rootScope.$broadcast('bitloxConnectError'); 

    }    
  },20000)

  this.currentPromise = $q.defer()

  evothings.ble.stopScan();

  evothings.ble.connect(address, function(device) {
    console.log('new device state: '+device.state)
    if (device.state == 2) {
      BleApi.deviceHandle = device.deviceHandle;
      BleApi.getServices();
    } else if(device.state === 0 || device.state === 3) {
          BleApi.disconnect()
    }
    // this never seems to get called, except status === 1 which means the connection is now in progress on iOS
    else {
      // console.log("CONNECTION TO BLE FAILED")
      // $rootScope.$applyAsync(function() {
      //   status = BleApi.STATUS_DISCONNECTED
      // });
      // BleApi.sendData({error: new Error('Unable to connect to BitLox BLE')}, BleApi.TYPE_ERROR);
    }
  },
  function(errorCode) {

    BleApi.displayStatus('connect: ' + errorCode);
    delete knownDevices[address]
    // BleApi.startScanNew();

    if(parseInt(errorCode,10) === 133) {

      console.log("BitLox Disconnected from BLE: 133")
    
    } else if(parseInt(errorCode,10) === 8) {
      console.log("BitLox Disconnected from BLE: 8")
      $rootScope.$digest()
    }

    BleApi.disconnect();
  }, function(errorCode) {

  });    


  return this.currentPromise.promise
}
this.disconnect = function() {
  currentCommand = null

  this.sessionIdHex = null;
  $timeout.cancel(BleApi.timeout)
  evothings.ble.close(BleApi.deviceHandle)
  $rootScope.$applyAsync(function() {
    status = BleApi.STATUS_DISCONNECTED;
  })
  if(status !== BleApi.STATUS_DISCONNECTED && status !== BleApi.STATUS_INITIALIZING) { 
    console.log("broadcasting disconnection notice")
    $rootScope.$broadcast('bitloxConnectError'); 
  }
  knownDevices = {}
  BleApi.startScanNew();
}
// old sliceAndWrite64, 'data' is a command constant
this.write = function(data, timer, noPromise, forcePing) {
  console.log("ready to write status: " + status + ": command: " +data)
  if(status !== BleApi.STATUS_INITIALIZING && status !== BleApi.STATUS_CONNECTED && status !== BleApi.STATUS_IDLE) {
    // return if the device isn't currently idle
    if(status == BleApi.STATUS_DISCONNECTED) {
      return $q.reject(new Error("Device is not connected"))
    }

    return $q.reject(new Error("Device is busy"))
  }
  $rootScope.$applyAsync(function() {
    status = BleApi.STATUS_WRITING
  });
  if(!forcePing && !this.sessionIdMatch && data.indexOf(deviceCommands.ping) === -1 && data.indexOf(deviceCommands.initPrefix) === -1) {
      return this.write(deviceCommands.ping).then(function(pingResult) {
          if(!pingResult) {
              console.log("session id not found or ping failed")
              return $q.reject(new Error('BitLox session errr. Try reconnecting the BitLox'))
          }
          var sessionIdHex = pingResult.payload.echoed_session_id.toString('hex')
          if(sessionIdHex !== BleApi.sessionIdHex) {
              console.log("session id does not match")
              return $q.reject(new Error('BitLox session expired. Try reconnecting the BitLox'))
          }
          BleApi.sessionIdMatch = true;
          return BleApi.write(data, timer, noPromise)
      })
  }

  if(!noPromise) this.currentPromise = $q.defer();
  var chunkSize = 128;
  var thelength = data.length;
  var iterations = Math.floor(thelength/chunkSize);
  // console.log('iterations : ' + iterations);
  var remainder  = thelength%chunkSize;
  // console.log('remainder : ' + remainder);
  var k = 0;
  var m = 0;
  var transData = [];

  // 		chop the command up into k pieces
  for(k = 0; k < iterations; k++)
  {
    transData[k] = data.slice(k*chunkSize,chunkSize+(k*chunkSize));
    // console.log("k " + k);
  };

  // console.log("k out " + k);

  // 		deal with the leftover, backfilling the frame with zeros
  if(remainder != 0)
  {
    transData[k] = data.slice((k)*chunkSize,remainder+((k)*chunkSize));
    for (m = remainder; m < chunkSize; m++)
    {
      transData[k] = transData[k].concat("0");
    }
    // console.log("remainder " + transData[k]);

    // console.log("remainder length " + transData[k].length);
  };

  // 		The BLE writer takes ByteBuffer arrays
  var ByteBuffer = dcodeIO.ByteBuffer;
  var j = 0;
  var parseLength = 0;
  // console.log("transData.length " + transData.length);

  async.eachSeries(transData, function(data, next) {
    parseLength = data.length

    var bb = new ByteBuffer();
    //  console.log("utx length = " + parseLength);
    var i;
    for (i = 0; i < parseLength; i += 2) {
      var value = data.substring(i, i + 2);
      //  console.log("value = " + value);
      var prefix = "0x";
      var together = prefix.concat(value);
      //  console.log("together = " + together);
      var result = parseInt(together);
      //  console.log("result = " + result);

      bb.writeUint8(result);
    }
    bb.flip();

    BleApi.bleWrite(
      'writeCharacteristic',
      BleApi.deviceHandle,
      BleApi.characteristicWrite,
      bb
      , function(err) {
        if(err) {
          return next(new Error('Command Write Error'))
        } else {
          BleApi.sessionIdMatch = false;
          return next()
        }
      });
  }, function(err) {
    if(err) {
      console.log("Command write error")
      return BleApi.disconnect();
    }
    $rootScope.$applyAsync(function() {
      status = BleApi.STATUS_READING
    })

  })

  if(!noPromise) {
    if(!timer) timer = 30000;
    console.log(timer + " milliseconds.")

    BleApi.timeout = $timeout(function() {
      console.warn("TIMEOUT of Write Command")
      evothings.ble.close(BleApi.deviceHandle)
      return BleApi.sendData({error: new Error('Command Timeout')}, BleApi.TYPE_ERROR)

    },timer)
  }
  return this.currentPromise.promise;
};
/**
* 	Assembles whole message strings
* 	The raw data is going to be coming in in possible uncompleted parts.
* 	We will sniff for the 2323 and commence storing data from there.
* 	The payload size is grabbed from the first 2323 packet to determine when we are done and
* 	may send the received message onwards.
*/
this.sendToProcess = function(rawData) {
	// console.log('data final: ' + rawData);
	var rawSize = rawData.length;
	// console.log('rawSize: ' + rawSize);
	// console.log('incomingData at top ' + incomingData);

	// Grab the incoming frame and add it to the global incomingData
      // We match on 2323 and then toggle the dataReady boolean to get ready for any subsequent frames
	if (rawData.match(/2323/) || dataReady == true)
	{
		// console.log('or match ');
		incomingData = incomingData.concat(rawData);
		// console.log('incomingData ' + incomingData);

    // 			Find out how long the total message is. This must be stored globally as the
    // 			sendToProcess routine is called repeatedly blanking local variables
		if (incomingData.match(/2323/))
		{
			// console.log('header match');
			dataReady = true;
			var headerPosition = incomingData.search(2323)
			payloadSize = incomingData.substring(headerPosition + 8, headerPosition + 16)
			// console.log('PayloadSize hex: ' + payloadSize);
			var decPayloadSize = parseInt(payloadSize, 16);
			// console.log('decPayloadSize: ' + decPayloadSize);
			// console.log('decPayloadSize*2 + 16: ' + ((decPayloadSize *2) + 16));
		}
	}
  // 		Once the incomingData has grown to the length declared, send it onwards.
	if(incomingData.length === ((decPayloadSize*2) + 16))
	{
		var dataToSendOut = incomingData;
		incomingData = '';
		dataReady = false;
    /**
     *  Takes whole message strings and preps them for consumption by the processResults function
    */

    if (dataToSendOut.match(/2323/)) {
      var headerPosition = dataToSendOut.search(2323);
      var command = dataToSendOut.substring(headerPosition + 4, headerPosition + 8);
      // document.getElementById("command").innerHTML = command;
      var payloadSize2 = dataToSendOut.substring(headerPosition + 8, headerPosition + 16);
      // console.log('PayloadSize: ' + payloadSize2);
      var decPayloadSize = parseInt(payloadSize2, 16);
      // console.log('decPayloadSize: ' + decPayloadSize);
      // console.log('decPayloadSize*2 + 16: ' + ((decPayloadSize *2) + 16));

      // document.getElementById("payLoadSize").innerHTML = payloadSize2;
      var payload = dataToSendOut.substring(headerPosition + 16, headerPosition + 16 + (2 * (decPayloadSize)));
      // document.getElementById("payload_HEX").innerHTML = payload;
      // document.getElementById("payload_ASCII").innerHTML = hex2a(payload);
      // console.log('ready to process: ' + dataToSendOut);
      this.processResults(command, payloadSize2, payload);
    }
	}
}

this.sendData = function(data,type) {
  currentCommand = null;

  $timeout.cancel(BleApi.timeout)

  $rootScope.$applyAsync(function() {

    if(type === BleApi.TYPE_INITIALIZE) {
      status = BleApi.STATUS_CONNECTED;
    } else {
      status = BleApi.STATUS_IDLE;
    }    
    BleApi.currentPromise.resolve({type: type, payload:data});

  })
  // console.log('sending data back to promise')
  // console.log(JSON.stringify(data))
}

this.processResults = function(command, length, payload) {
  // 			console.log("RX: " + command);
  command = command.substring(2, 4)
  //  			window.plugins.toast.show('to process: ' + command, 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  console.log('to process: ' + command + ' ' + length + ' ' + payload);
  switch (command) {
    case "3a": // initialize
    case "3A":
      this.sendData({},BleApi.TYPE_INITIALIZE)
    break;

    case "30": // public address
        ecdsa = payload.substring(8, 74);
        // 					ecdsa = payload.substring(8,138); //uncompressed
        // 					console.log('ecdsa from device ' + ecdsa);
        document.getElementById("ecdsa").innerHTML = ecdsa;
        ripe160of2 = payload.substring(78, 118);
        // 					ripe160of2 = payload.substring(142,182);
        document.getElementById("ripe160of2").innerHTML = ripe160of2;
        // 					console.log('RIPE from device ' + ripe160of2);
        pub58 = ecdsaToBase58(ecdsa);
        document.getElementById("address_58").innerHTML = pub58;
    break;

    case "31": // number of addresses in loaded wallet
        numberOfAddresses = payload.substring(2, 4);
        // 					console.log('# of addresses ' + numberOfAddresses);
        document.getElementById("numberOfAddresses").innerHTML = numberOfAddresses;
        break;

    case "32": // Wallet list
      var walletMessage = protoDevice.Wallets.decodeHex(payload).wallet_info;
      this.sendData({wallets:walletMessage},BleApi.TYPE_WALLET_LIST)
    break;

    case "33": // Ping response
      var PingResponse = protoDevice.PingResponse.decodeHex(payload);
      this.sendData(PingResponse,BleApi.TYPE_PONG)
    break;
    case "34": // success
      switch (currentCommand) {
        case "deleteWallet":
					BleApi.displayStatus('Wallet deleted');
					$('#myTab a[href="#bip32"]').tab('show');

					window.plugins.toast.show('Refreshing your wallet list', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
					$('#helpBlock').text('Click the wallet name and enter the PIN on your BitLox');

					BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);

					BleApi.displayStatus('Listing wallets');
					currentCommand = '';
					break;
	      case "renameWallet":
          BleApi.displayStatus('Wallet renamed');
          $('#myTab a[href="#bip32"]').tab('show');

          window.plugins.toast.show('Refreshing your wallet list', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
          $('#helpBlock').text('Click the wallet name and enter the PIN on your BitLox');

          BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
          $('#renameWallet').attr('disabled',false);

					BleApi.displayStatus('Listing wallets');
					currentCommand = '';
				break;
	      case "newWallet":
					this.sendData({},BleApi.TYPE_SUCCESS)
				break;
				case "formatDevice":
					window.plugins.toast.show('Format successful', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
					BleApi.displayStatus('Ready');
					BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
					$('#myTab a[href="#bip32"]').tab('show');
					currentCommand = '';
				break;
        case "setChangeAddress":

          this.sendData({}, BleApi.TYPE_SUCCESS);
          currentCommand = '';
        break;
				case "loadWallet":
					// window.plugins.toast.show('Wallet loaded', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
					// document.getElementById("transactionDisplayList").innerHTML = '';
					// document.getElementById("balance_display").innerHTML = '';
					// document.getElementById("payment_title").value = '';
					// document.getElementById("receiver_address").value = '';
					// document.getElementById("receiver_monies").value = '';
					// document.getElementById("output_transaction").value = '';
					// document.getElementById("rawTransaction").value = '';
					// document.getElementById("device_signed_transaction").value = '';
					// $("#rawTransactionStatus").addClass('hidden');
					// $('#myTab a[href="#walletDetail"]').tab('show');
		      BleApi.displayStatus('Got wallet, waiting for XPUB request from wallet factory...');
          this.sendData({}, BleApi.TYPE_SUCCESS);
      		// $("#renameWallet").attr('disabled',false);
      		// $("#newWalletButton").attr('disabled',false);
      		// $(".wallet_row").attr('disabled',false);
      		// $('#list_wallets').attr('disabled',false);
          // // 							$('#forceRefresh').attr('disabled',true);
          // $('#transactionDisplayListHeading').attr('hidden',true);

		      currentCommand = '';
		    break;
				case "signAndSend":
					BleApi.app.sliceAndWrite64(tempTXglobal);
					tempTXglobal = '';
          // 							currentCommand = '';
					break;
				default:
					BleApi.displayStatus('Success');
				break;
      }

    break;

    case "35": // general purpose error/cancel
      var Failure = protoDevice.Failure.decodeHex(payload);
      this.sendData({}, Failure,BleApi.TYPE_ERROR)
    	switch (currentCommand) {
				case "deleteWallet":
        // 							BleApi.displayStatus('Wallet deleted');
        // 							$('#myTab a[href="#bip32"]').tab('show');
        //
        // 							window.plugins.toast.show('Refreshing your wallet list', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        // 							$('#helpBlock').text('Click the wallet name and enter the PIN on your BitLox');
        //
        // 							BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
        //
        // 							BleApi.displayStatus('Listing wallets');
					currentCommand = '';
				break;
				case "renameWallet":
        // 							BleApi.displayStatus('Wallet renamed');
        // 							$('#myTab a[href="#bip32"]').tab('show');
        //
        // 							window.plugins.toast.show('Refreshing your wallet list', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        // 							$('#helpBlock').text('Click the wallet name and enter the PIN on your BitLox');
        //
        // 							BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
        //         					$('#renameWallet').attr('disabled',false);
        //
        // 							BleApi.displayStatus('Listing wallets');
					currentCommand = '';
				break;
				case "newWallet":
        // 							window.plugins.toast.show('Refreshing your wallet list', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        //
        // 							$('#helpBlock').text('Click the wallet name and enter the PIN on your BitLox');
        // 							pausecomp(15000);
        // 							BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
        //
        // 							BleApi.displayStatus('Listing refreshed');
        //
					currentCommand = '';
				break;
				case "formatDevice":
        // 							window.plugins.toast.show('Format successful', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        // 							BleApi.displayStatus('Ready');
        // 							BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
        // 							$('#myTab a[href="#bip32"]').tab('show');
					currentCommand = '';
				break;
				case "loadWallet":

					currentCommand = '';
				break;
				default:
        // 							BleApi.displayStatus('Error');
				break;
    	}

      break;

    case "36": // device uuid return
      var DeviceUUID = protoDevice.DeviceUUID.decodeHex(payload);
      //DeviceUUID.device_uuid.toString("hex")
      this.sendData(DeviceUUID,BleApi.TYPE_UUID)
      break;

    case "37": // entropy return
      var Entropy = protoDevice.Entropy.decodeHex(payload);
      this.sendData(Entropy,BleApi.TYPE_ENTROPY_RETURN)
      break;

    case "39": // signature return [original]
      var Signature = protoDevice.Signature.decodeHex(payload);
      // 					Signature.signature_data
      this.sendData(Signature,BleApi.TYPE_SIGNATURE)
      break;

    case "50": // #define PACKET_TYPE_ACK_REQUEST			0x50
      this.write(deviceCommands.button_ack,BleApi.TYPE_PLEASE_ACK);
      break;

    case "56": // #define PACKET_TYPE_OTP_REQUEST			0x56
      BleApi.displayStatus('OTP');
      respondToOTPrequest();
      break;

    case "62": // parse & insert xpub from current wallet //RETURN from scan wallet
			var CurrentWalletXPUB = protoDevice.CurrentWalletXPUB.decodeHex(payload);
      this.sendData(CurrentWalletXPUB,BleApi.TYPE_XPUB)
    break;

    case "64": // signature return
            var signedScripts = [];
            var sigs = protoDevice.SignatureComplete.decodeHex(payload).signature_complete_data;
            sigs.forEach(function(sig) {
                var sigHex = sig.signature_data_complete.toString('hex');
                var sigSize = parseInt(sigHex.slice(0, 2), 16);
                var sigChars = 2 + (sigSize * 2);
                sigHex = sigHex.slice(0, sigChars);
                signedScripts.push(sigHex);
            });
            this.sendData({
                signedScripts: signedScripts
            }, BleApi.TYPE_SIGNATURE_RETURN);        // 						console.log("SignatureComplete:Data:signature_data_complete part SIGNED " + sigIndex + " " + unSignedTransaction);
    break;

    case "71": // message signing return
    	console.log("########## in case 71 ###########");
           window.plugins.toast.show('Processing signature', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        var SignatureMessage = protoDevice.SignatureMessage.decodeHex(payload);

        var data_size = (SignatureMessage.signature_data_complete.toString("hex").length)/2;
        var data_size_hex = d2h(data_size);

			console.log("SigMsg signature_data length: " + data_size_hex);
			console.log("SigMsg signature_data hex: " + SignatureMessage.signature_data_complete.toString("hex"));

				var SigByteArrayHex = Crypto.util.hexToBytes(SignatureMessage.signature_data_complete.toString("hex"));

				var compressed = true;
				var addrtype = 0;
				var address = document.getElementById("sgAddr").value;
    			var message = document.getElementById("sgMsgHidden").value;

				var sig = sign_message_device_processing(message, address, SigByteArrayHex, compressed, addrtype);

				sgData = {"message":message, "address":address, "signature":sig};
				var sgType = 'inputs_io';

				$('#sgSig').val(makeSignedMessage(sgType, sgData.message, sgData.address, sgData.signature));
    break;

    case "82": // bulk return
    	console.log("########## in case 82 ###########");
        Bulk = protoDevice.Bulk.decodeHex(payload);

        var data_size = (Bulk.bulk.toString("hex").length)/2;
        var data_size_hex = d2h(data_size);

				BulkString = Bulk.bulk.toString("hex")
        // 					console.log("Bulk.bulk raw: " + Bulk.bulk);
				console.log("Bulk.bulk length: " + data_size_hex);
        // 					console.log("Bulk.bulk hex: " + BulkString);
    break;

    default:
    break;
  } //switch
} //function processResults

  /**
   * Application object that holds data and functions used by the BleApi.app.
   */

  this.app = {
  	updateTimer: null,





  	hiddenWalletCallback: function (results)
  	{
  		if(results.buttonIndex == 1)
  		{
  // 			event.preventDefault();
  			currentCommand = "loadWallet";
  			directLoadWallet(results.input1);
  			this.displayStatus('Loading wallet');

  			window.plugins.toast.show('Check your BitLox', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  			document.getElementById("loaded_wallet_name").innerHTML = "<small><i>HIDDEN</i></small>";

  		}
  		if(results.buttonIndex == 2)
  		{
  			// Cancel clicked
  		}
  	},





  	PINcallback: function (results)
  	{
  		if(results.buttonIndex == 1)
  		{
  			var PINvalue = window.localStorage['PINvalue'];
  			// OK clicked, show input value
  			if(results.input1 != PINvalue)
  			{
  				this.initialize();
  			}else if(results.input1 === PINvalue){
  				$("#theBody").removeClass('grell');
  				$('#myTab a[href="#ble_scan"]').tab('show');
  				$("#renameWallet").attr('disabled',true);
  			}

  		}
  		if(results.buttonIndex == 2)
  		{
  			// Cancel clicked
  			this.initialize();
  		}
  	},


  	firstPINcache: function (resultsFirst)
  	{
  		if(resultsFirst.buttonIndex == 1)
  		{
  			this.pinTheFirst = resultsFirst.input1;
  // 			alert(this.pinTheFirst);
  			pausecomp(300);
  			window.plugins.pinDialog.prompt("Verify your desired PIN", this.PINsetcallback, "RE-ENTER APP PIN", ["OK","Cancel"]);

  		}else if(resultsFirst.buttonIndex == 2)
  		{
  // 		alert("You can later set a PIN in the extras menu");
  			this.pinFirstDecline = 1;
  			// Cancel clicked
          	window.plugins.toast.show('Canceled', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  			$("#theBody").removeClass('grell');
  			$('#myTab a[href="#ble_scan"]').tab('show');
  			$("#renameWallet").attr('disabled',true);
  		}
  	},

  	PINsetcallback: function (results)
  	{
  		if(results.buttonIndex == 1)
  		{
  			if(results.input1 == this.pinTheFirst)
  			{
  				window.localStorage['PINvalue'] = results.input1;
  				var PINvalue = window.localStorage['PINvalue'];
  				window.plugins.toast.show('PIN set to: ' + PINvalue, 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  // 				alert('PIN set to: ' + PINvalue);
  				window.localStorage['PINstatus'] = 'true';
  				var PINstatus = window.localStorage['PINstatus'];
  				globalPINstatus = 'true';
  				$("#theBody").removeClass('grell');
  				$('#myTab a[href="#ble_scan"]').tab('show');
  				$("#renameWallet").attr('disabled',true);
  			}else
  			{
  				window.plugins.toast.show('PINs don\'t match', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  				pausecomp(300);
  				this.setAppPIN();
  			}
  		}
  		if(results.buttonIndex == 2)
  		{
  			// Cancel clicked
          	window.plugins.toast.show('Canceled', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  			$("#theBody").removeClass('grell');
  			$('#myTab a[href="#ble_scan"]').tab('show');
  			$("#renameWallet").attr('disabled',true);
  		}
  	},

  	showAppPIN: function()
  	{
  		alert('globalPINstatus' + globalPINstatus);
  		var PINstatus = window.localStorage['PINstatus'];
  		alert('PINstatus' + PINstatus);
  	},


  	setAppPIN: function()
  	{
  		window.plugins.pinDialog.prompt("Enter your desired PIN", this.firstPINcache, "SET APP PIN", ["OK","Cancel"]);
  	},

  	getPINstatus: function()
  	{
  		var PINstatus = window.localStorage['PINstatus'];
  		return PINstatus;
  	},


  	getPIN: function (status)
  	{

  			if(status === 'true'){
  				window.plugins.pinDialog.prompt("Enter App PIN to proceed", this.PINcallback, "SECURE AREA", ["OK","Cancel"]);
  			}else if(status !== 'false' && status !== 'true'){
  				pausecomp(1000);
  				this.setAppPIN();
  			}
  	},





  	/** Close all connected devices. */
  	closeConnectedDevices: function()
  	{
  			$.each(this.knownDevices, function(key, device)
  			{
  				this.deviceHandle && evothings.ble.close(this.deviceHandle);
  			});
  		this.knownDevices = {};

  	},



  /**
  * 	Chops up the command/data to send into either 64 byte (iOS) or 20 byte (android) chunks,
  * 	zero-fills out to the end of the current frame and transforms into a byte buffer for sending out via BLE
  *   This command replaces the previously used "hidWriteRawData" and is aliased inside of "autoCannedTransaction" as it
  *	replaces the functions of both of those.
  *	As iOS and Android seem to have different tolerances for transmission speed, the blocksize and transmission delay
  *	are broken out for each. It may be desirable in the settings of the app that these parameters could be "Tuned" to different handsets.
  *	(My testbed is an old Huawei Android handset) - or possible dynamically set via a ping/echo check of connectivity speed.
  *	data: hex encoded string
  */





  // 	This function adds the parameters the write function needs
  	writeDeviceName: function(newDeviceName)
  	{
  // 		alert("name: "+this.characteristicName);
  // 		alert("write: "+this.characteristicWrite);

  // 		this.write(
  // 			'writeDescriptor',
  // 			this.deviceHandle,
  // 			this.descriptorName,
  // 			new Uint8Array([35,35,61,61]));

  		this.writeWithResults(
  			'writeCharacteristic',
  			this.deviceHandle,
  			this.characteristicName,
  			newDeviceName);
  	},




  // 	Actual write function
  	writeWithResults: function(writeFunc, deviceHandle, handle, value)
  	{
  		if (handle)
  		{
  			ble[writeFunc](
  				deviceHandle,
  				handle,
  				value,
  				function()
  				{
  					window.plugins.toast.show('Device renamed successfully', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  // 					alert(writeFunc + ': ' + handle + ' success.');
  					console.log(writeFunc + ': ' + handle + ' success.');
  				},
  				function(errorCode)
  				{
  // 					alert(writeFunc + ': ' + handle + ' error: ' + errorCode);

  					console.log(writeFunc + ': ' + handle + ' error: ' + errorCode);
  				});
  		}
  		$('#myTab a[href="#ble_scan"]').tab('show');
  		$('#renameDeviceButton').attr('disabled',false);
  		this.onStopScanButton();
  		this.onStartScanButton();
  	},





  /**
   * 	Opens reading & writing services on the BitLox device. The uuids are specific to the BitLox hardware
  */


  	openBrowser: function(url)
  	{
  		window.open(url, '_system', 'location=yes')
  	},

  	scanQR:	function()
  	{
  		cloudSky.zBar.scan(
  		{
  // 			camera: "back" // defaults to "back"
  // 			flash: "auto", // defaults to "auto". See Quirks
  			drawSight: false //defaults to true, create a red sight/line in the center of the scanner view.
  		}, function(s){
  			s = s.replace(/bitcoin\:/g,'');
  			document.getElementById('receiver_address').value = s;
  			this.displayStatus('QR code scanned');
  		}, function(){
  			this.displayStatus('Error scanning QR');
  		});
  	},


  // Display the device list.
  displayDeviceList: function()
  {
  	// Clear device list.
  	$('#found-devices').empty();
  	var timeNow = Date.now();

  	$.each(this.knownDevices, function(key, device)
  	{
  		// Only show devices that are updated during the last 10 seconds.
  		if (device.timeStamp + 10000 > timeNow)
  		{
  			// Map the RSSI value to a width in percent for the indicator.
  			var rssiWidth = 100; // Used when RSSI is zero or greater.
  			if (device.rssi < -100) { rssiWidth = 0; }
  			else if (device.rssi < 0) { rssiWidth = 100 + device.rssi; }

  			// Create tag for device data.
  			var element = $(
  				'<li id="device_chosen" class="deviceSelection device-list" data-target="#bip32"  data-addr="'+ device.address +'" data-name="'+device.name+'">'
  				+	'<span >'
  				+	'<strong>' + device.name + '</strong><br />'
  				// Do not show address on iOS since it can be confused
  				// with an iBeacon UUID.
  // 				+	(evothings.os.isIOS() ? '' : device.address + '<br />')
  // 				+	(evothings.os.isIOS() ? device.address : device.address + '<br />')
  				+	'<small><span class="left-label">SIGNAL STRENGTH  </small></span>&nbsp;<span class="right-signal">' +device.rssi + ' dB</span><br />'
  				+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
  				+ 		rssiWidth*2 + '%;"></div>'
  				+	'</span>'
  				+ '</li>'
  			);

  			$('#found-devices').append(element);
  		}
  	});
  },




  };
  // End of app object.


/////////////////////////////////////////////////
// functions from Brainwallet for message signing
/////////////////////////////////////////////////

    var key = null;
    var network = null;
    var gen_from = 'pass';
    var gen_compressed = false;
    var gen_eckey = null;
    var gen_pt = null;
    var gen_ps_reset = false;
    var TIMEOUT = 600;
    var timeout = null;

    var PUBLIC_KEY_VERSION = 0;
    var PRIVATE_KEY_VERSION = 0x80;
//     var ADDRESS_URL_PREFIX = 'http://blockchain.info'

    var sgData = null;
    var sgType = 'inputs_io';

    function setErrorState(field, err, msg) {
        var group = field.closest('.controls');
        if (err) {
            group.addClass('has-error');
            group.attr('title',msg);
        } else {
            group.removeClass('has-error');
            group.attr('title','');
        }
    }

    function sgOnChangeType() {
        var id = $(this).attr('name');
        if (sgType!=id)
        {
          sgType = id;
          if (sgData!=null)
            sgSign();
        }
    }

//     function updateAddr(from, to) {
    function updateAddr(to) {
//         var sec = from.val();
        var addr = '';
        var eckey = null;
        var compressed = false;
        try {
            var res = parseBase58Check(sec);
            var version = res[0];
            var payload = res[1];
            if (payload.length > 32) {
                payload.pop();
                compressed = true;
            }
            eckey = new Bitcoin.ECKey(payload);
            var curve = getSECCurveByName("secp256k1");
            var pt = curve.getG().multiply(eckey.priv);
            eckey.pub = getEncoded(pt, compressed);
            eckey.pubKeyHash = Bitcoin.Util.sha256ripe160(eckey.pub);
            addr = new Bitcoin.Address(eckey.getPubKeyHash());
            addr.version = (version-128)&255;
            setErrorState(from, false);
        } catch (err) {
            setErrorState(from, true, "Bad private key");
        }
        to.val(addr);
        return {"key":eckey, "compressed":compressed, "addrtype":version, "address":addr};
    }

    function sgGenAddr() {
        updateAddr($('#sgSec'), $('#sgAddr'));
    }

    function sgOnChangeSec() {
        $('#sgSig').val('');
        sgData = null;
        clearTimeout(timeout);
        timeout = setTimeout(sgGenAddr, TIMEOUT);
    }

    function fullTrim(message)
    {
        console.log("in FullTrim");
        message = message.replace(/^\s+|\s+$/g, '');
        message = message.replace(/^\n+|\n+$/g, '');
        return message;
    }

    var sgHdr = [
      "-----BEGIN BITCOIN SIGNED MESSAGE-----",
      "-----BEGIN SIGNATURE-----",
      "-----END BITCOIN SIGNED MESSAGE-----"
    ];

    var qtHdr = [
      "-----BEGIN BITCOIN SIGNED MESSAGE-----",
      "-----BEGIN BITCOIN SIGNATURE-----",
      "-----END BITCOIN SIGNATURE-----"
    ];

    function makeSignedMessage(type, msg, addr, sig)
    {
      if (type=='inputs_io')
        return sgHdr[0]+'\n'+msg +'\n'+sgHdr[1]+'\n'+addr+'\n'+sig+'\n'+sgHdr[2];
      else if (type=='armory')
        return sig;
      else
        return qtHdr[0]+'\n'+msg +'\n'+qtHdr[1]+'\nVersion: Bitcoin-qt (1.0)\nAddress: '+addr+'\n\n'+sig+'\n'+qtHdr[2];
    }

    function sgSign() {
      var message = $('#sgMsg').val();
      var p = updateAddr($('#sgSec'), $('#sgAddr'));

      if ( !message || !p.address )
        return;

      message = fullTrim(message);

      if (sgType=='armory') {
        var sig = armory_sign_message (p.key, p.address, message, p.compressed, p.addrtype);
      } else {
        var sig = sign_message(p.key, message, p.compressed, p.addrtype);
      }

      sgData = {"message":message, "address":p.address, "signature":sig};

      $('#sgSig').val(makeSignedMessage(sgType, sgData.message, sgData.address, sgData.signature));
    }

    function sgOnChangeMsg() {
        $('#sgSig').val('');
        sgData = null;
        clearTimeout(timeout);
        timeout = setTimeout(sgUpdateMsg, TIMEOUT);
    }

    function sgUpdateMsg() {
        $('#vrMsg').val($('#sgMsg').val());
    }

    // -- verify --
    function vrOnChangeSig() {
        //$('#vrAlert').empty();
        window.location.hash='#verify';
    }

    function vrPermalink()
    {
      var msg = $('#vrMsg').val();
      var sig = $('#vrSig').val();
      var addr = $('#vrAddr').val();
      return '?vrMsg='+encodeURIComponent(msg)+'&vrSig='+encodeURIComponent(sig)+'&vrAddr='+encodeURIComponent(addr);
    }

    function splitSignature(s)
    {
      var addr = '';
      var sig = s;
      if ( s.indexOf('\n')>=0 )
      {
        var a = s.split('\n');
        addr = a[0];

        // always the last
        sig = a[a.length-1];

        // try named fields
//         Since we are not going to be doing Armory or bt-qt style sigs, we don't need this
//         var h1 = 'Address: ';
//         for (i in a) {
//           var m = a[i];
//           if ( m.indexOf(h1)>=0 )
//             addr = m.substring(h1.length, m.length);
//         }

        // address should not contain spaces
        if (addr.indexOf(' ')>=0)
          addr = '';

        // some forums break signatures with spaces
        sig = sig.replace(" ","");
      }
      console.log("in splitSignature address = " + addr);
      console.log("in splitSignature signature = " + sig);
      return { "address":addr, "signature":sig };
    }

    function splitSignedMessage(s)
    {
      s = s.replace('\r','');

      for (var i=0; i<2; i++ )
      {
        var hdr = i==0 ? sgHdr : qtHdr;

        var p0 = s.indexOf(hdr[0]);
        if ( p0>=0 )
        {
          var p1 = s.indexOf(hdr[1]);
          if ( p1>p0 )
          {
            var p2 = s.indexOf(hdr[2]);
            if ( p2>p1 )
            {
              var msg = s.substring(p0+hdr[0].length+1, p1-1);
              console.log("in splitSignedMessage msg = " + msg);
              var sig = s.substring(p1+hdr[1].length+1, p2-1);
              console.log("in splitSignedMessage sig = " + sig);
              var m = splitSignature(sig);
              msg = fullTrim(msg); // doesn't work without this
              return { "message":msg, "address":m.address, "signature":m.signature };
            }
          }
        }
      }
      return false;
    }

    function vrVerify() {
    console.log("in vrVerify");
        var s = $('#vrSig').val();
    console.log("s: \n" + s);
        var p = splitSignedMessage(s);
        var res = verify_message(p.signature, p.message, PUBLIC_KEY_VERSION);

        if (!res) {
          var values = armory_split_message(s);
          res = armory_verify_message(values);
          p = {"address":values.Address};
        }

        $('#vrAlert').empty();

        var clone = $('#vrError').clone();

        if ( p && res && (p.address==res || p.address==''))
        {
          clone = p.address==res ? $('#vrSuccess').clone() : $('#vrWarning').clone();
          clone.find('#vrAddr').text(res);
        }

        clone.appendTo($('#vrAlert'));

        return false;
    }




    function txOnAddDest() {
        var list = $(document).find('.txCC');
        var clone = list.last().clone();
        clone.find('.help-inline').empty();
        clone.find('.control-label').text('Cc');
        var dest = clone.find('#txDest');
        var value = clone.find('#txValue');
        clone.insertAfter(list.last());
        onInput(dest, txOnChangeDest);
        onInput(value, txOnChangeDest);
        dest.val('');
        value.val('');
        $('#txRemoveDest').attr('disabled', false);
        return false;
    }

    function txOnRemoveDest() {
        var list = $(document).find('.txCC');
        if (list.size() == 2)
            $('#txRemoveDest').attr('disabled', true);
        list.last().remove();
        return false;
    }

    function txOnChangeDest() {
        var balance = parseFloat($('#txBalance').val());
        var fval = parseFloat('0'+$('#txValue').val());
        var fee = parseFloat('0'+$('#txFee').val());

        if (fval + fee > balance) {
            fee = balance - fval;
            $('#txFee').val(fee > 0 ? fee : '0.00');
        }

        clearTimeout(timeout);
        timeout = setTimeout(txRebuild, TIMEOUT);
    }




/**
*	Loads wallet via direct input of a wallet number
*	Useful for hidden wallet loading
*
*	parameters: wallet number
*/
	function directLoadWallet(walletToLoad) {
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();

		var walletToLoadNumber = Number(walletToLoad);
        var loadWalletMessage = new protoDevice.LoadWallet({
			"wallet_number": walletToLoadNumber
        });
        tempBuffer = loadWalletMessage.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
	console.log("tempTXstring = " + tempTXstring);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "000B";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);
	}






	function respondToOTPrequest()
	{
		BleApi.displayStatus('OTP request');

		window.plugins.pinDialog.promptClear("Enter OTP shown on BitLox", constructOTP, "OTP", ["CONFIRM","CANCEL"]);

	}


/**
*	Sends OTP response
*	Needed for dangerous operations such as formatting or wallet deletion.
*
*	parameters: none, but probably should be passed instead of pulled from the page
*/
    function constructOTP(results) {
    	if(results.buttonIndex == 1)
		{
			var ProtoBuf = dcodeIO.ProtoBuf;
			var ByteBuffer = dcodeIO.ByteBuffer;
			var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
				Device = builder.build();

			var otpCommandValue = results.input1;

			var otpMessage = new protoDevice.OtpAck({
				"otp": otpCommandValue
			});

			tempBuffer = otpMessage.encode();
			var tempTXstring = tempBuffer.toString('hex');
			document.getElementById("temp_results").innerHTML = tempTXstring;
			txSize = d2h((tempTXstring.length) / 2).toString('hex');
			console.log("tempTXstring = " + tempTXstring);
			var j;
			var txLengthOriginal = txSize.length;
			for (j = 0; j < (8 - txLengthOriginal); j++) {
				var prefix = "0";
				txSize = prefix.concat(txSize);
			}
			tempTXstring = txSize.concat(tempTXstring);

			var command = "0057";
			tempTXstring = command.concat(tempTXstring);

			var magic = "2323"
			tempTXstring = magic.concat(tempTXstring);
			console.log("tempTXstring = " + tempTXstring);
			BleApi.app.sliceAndWrite64(tempTXstring);
       }else if(results.buttonIndex == 2){
			BleApi.displayStatus('OTP canceled');
        	BleApi.app.sliceAndWrite64(deviceCommands.otp_cancel);

        }
    }


/**
*	Sends PIN response
*	DEPRECATED - PINs are now entered exclusively on the device itself
*
*	parameters: none
*/
	function constructPIN() {
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();
		var pin = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(document.getElementById('pin_input').value));

		var bbPIN = new ByteBuffer();
        var parseLength = pin.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = pin.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bbPIN.writeUint8(result);
        }
        bbPIN.flip();

        var pinAckMessage = new protoDevice.PinAck({
			"password": bbPIN
        });

        tempBuffer = pinAckMessage.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
	console.log("tempTXstring = " + tempTXstring);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0054";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);
 	}





	function putAll() {
	        console.log("In putAll");
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();
// 		var pin = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(document.getElementById('ping_input').value));

		var bbBulk = new ByteBuffer();
        var parseLength = BulkString.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = BulkString.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bbBulk.writeUint8(result);
        }
        bbBulk.flip();

        var BulkMessage = new protoDevice.SetBulk({
			"bulk": bbBulk
        });


        tempBuffer = BulkMessage.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
// 	console.log("tempTXstring = " + tempTXstring);
	console.log("txSize = " + txSize);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0083";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
//         console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);

	}



////////////////////////////
// Restore wallet
// document.getElementById('restore_wallet_input').value
// Responses: Success or Failure
// Response interjections: ButtonRequest
// wallet_name is stored purely for the convenience of the host. It should be
// a null-terminated UTF-8 encoded string with a maximum length of 40 bytes.
// To create an unencrypted wallet, exclude password.
// message NewWallet
// {
// 	optional uint32 wallet_number = 1 ;//[default = 0];
// 	optional bytes password = 2;
// 	optional bytes wallet_name = 3;
// 	optional bool is_hidden = 4 ;//[default = false];
// }
// Responses: Success or Failure
// Response interjections: ButtonRequest
// message RestoreWallet
// {
// 	required NewWallet new_wallet = 1;
// 	required bytes seed = 2;
// }
//
//
////////////////////////////

    function constructNewWalletRestore() {
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();

// WALLET NUMBER
// 		var walletNumber = Number(document.getElementById('new_wallet_number').value);
		var walletNumber = 49;

// PASSWORD *DEPRECATED* Value in this field merely toggles the on-device password routine
		var passwordString = '1';
		if (passwordString != ''){
			var password = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(passwordString));
			console.log("pass: " + password);
			var bbPass = new ByteBuffer();
			var parseLength = password.length
	// 	console.log("utx length = " + parseLength);
			var i;
			for (i = 0; i < parseLength; i += 2) {
				var value = password.substring(i, i + 2);
	// 	console.log("value = " + value);
				var prefix = "0x";
				var together = prefix.concat(value);
	// 	console.log("together = " + together);
				var result = parseInt(together);
	// 	console.log("result = " + result);

				bbPass.writeUint8(result);
			}
			bbPass.flip();
		}else{
			var bbPass = null;
		}

// NAME
        var nameToUse = document.getElementById('new_wallet_name').value;
        console.log("name: " + nameToUse);

        var nameToUseHexed = toHexPadded40bytes(nameToUse);
        console.log("namehexed: " + nameToUseHexed);

		var bbName = new ByteBuffer();
        var parseLength = nameToUseHexed.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = nameToUseHexed.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bbName.writeUint8(result);
        }
        bbName.flip();
// end NAME


// HIDDEN
		var is_hidden = document.getElementById("new_wallet_isHidden").checked;


        var newWalletMessage = new protoDevice.NewWallet({
        	"wallet_number": walletNumber
        	,
        	"password": bbPass
        	,
        	"wallet_name": bbName
        	,
        	"is_hidden": is_hidden
        });

		var restoreSeed = document.getElementById('restore_wallet_input').value;

		var sizeOfSeed =  restoreSeed.length;
        console.log("sizeOfSeed = " + sizeOfSeed);

        var bb = ByteBuffer.allocate((sizeOfSeed/2)+64);

        var i;
        for (i = 0; i < sizeOfSeed; i += 2) {
            var value = restoreSeed.substring(i, i + 2);
            // 		console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
            // 		console.log("together = " + together);
            var result = parseInt(together);
            // 		console.log("result = " + result);

            bb.writeUint8(result);
        }
        bb.flip();


		var restoreWalletMessage = new protoDevice.RestoreWallet({
			"new_wallet" : newWalletMessage
			,
			"seed" : bb
		});
        tempBuffer = newWalletMessage.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
	console.log("tempTXstring = " + tempTXstring);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0012";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);

//         return renameCommand;
    }


////////////////////////////
// New wallet
//
// Responses: Success or Failure
// Response interjections: ButtonRequest
// wallet_name is stored purely for the convenience of the host. It should be
// a null-terminated UTF-8 encoded string with a maximum length of 40 bytes.
// To create an unencrypted wallet, exclude password.
// message NewWallet
// {
// 	optional uint32 wallet_number = 1 ;//[default = 0];
// 	optional bytes password = 2;
// 	optional bytes wallet_name = 3;
// 	optional bool is_hidden = 4 ;//[default = false];
// }
////////////////////////////


	function onPromptNewWallet(results) {
		if(results.buttonIndex == 1)
		{
			BleApi.displayStatus('Creating wallet');
			window.plugins.toast.show('Check your BitLox', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
			constructNewWallet(results.input1);
		}else if(results.buttonIndex == 2)
		{
			window.plugins.toast.show('Canceled', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
		}
	}



////////////////////////////
// Device Restore wallet
//
// Responses: Success or Failure
// Response interjections: ButtonRequest
// wallet_name is stored purely for the convenience of the host. It should be
// a null-terminated UTF-8 encoded string with a maximum length of 40 bytes.
// To create an unencrypted wallet, exclude password.
//
// Uses NewWallet message type
// message NewWallet
// {
// 	optional uint32 wallet_number = 1 ;//[default = 0];
// 	optional bytes password = 2;
// 	optional bytes wallet_name = 3;
// 	optional bool is_hidden = 4 ;//[default = false];
// }
////////////////////////////

    function constructDeviceRestoreWallet() {
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();

// WALLET NUMBER
		var walletNumber = 49;

// PASSWORD *DEPRECATED* Value in this field merely toggles the on-device password routine
		var passwordString = '1';
		if (passwordString != ''){
			var password = Crypto.util.bytesToHex(Crypto.charenc.UTF8.stringToBytes(passwordString));
			console.log("pass: " + password);
			var bbPass = new ByteBuffer();
			var parseLength = password.length
	// 	console.log("utx length = " + parseLength);
			var i;
			for (i = 0; i < parseLength; i += 2) {
				var value = password.substring(i, i + 2);
	// 	console.log("value = " + value);
				var prefix = "0x";
				var together = prefix.concat(value);
	// 	console.log("together = " + together);
				var result = parseInt(together);
	// 	console.log("result = " + result);

				bbPass.writeUint8(result);
			}
			bbPass.flip();
		}else{
			var bbPass = null;
		}

// NAME
        var nameToUse = 'Restored wallet';
        console.log("name: " + nameToUse);

        var nameToUseHexed = toHexPadded40bytes(nameToUse);
        console.log("namehexed: " + nameToUseHexed);

		var bbName = new ByteBuffer();
        var parseLength = nameToUseHexed.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = nameToUseHexed.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bbName.writeUint8(result);
        }
        bbName.flip();
// end NAME


// HIDDEN
		var is_hidden = false;


        var newWalletMessage = new protoDevice.NewWallet({
        	"wallet_number": walletNumber
        	,
        	"password": bbPass
        	,
        	"wallet_name": bbName
        	,
        	"is_hidden": is_hidden
        });

        tempBuffer = newWalletMessage.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
	console.log("tempTXstring = " + tempTXstring);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0018";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);
    }

////////////////////////////
// Rename device
////////////////////////////
	function onPromptRenameDevice(resultsRename) {
		if(resultsRename.buttonIndex == 1)
		{
			var nameToUseHexed = toHexUTF8(resultsRename.input1);
			var nameArrayBytes = Crypto.util.hexToBytes(nameToUseHexed);
			var nameArray = new Uint8Array(nameArrayBytes);
			BleApi.app.writeDeviceName(nameArray);
		}else if(resultsRename.buttonIndex == 2)
		{
			window.plugins.toast.show('Canceled', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
			$('#renameDeviceButton').attr('disabled',false);
		}
	}




////////////////////////////
// Rename loaded wallet
////////////////////////////

	function onPromptRename(resultsRename) {
		if(resultsRename.buttonIndex == 1)
		{
			window.plugins.toast.show('Check your BitLox', 'long', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
			constructRenameWallet(resultsRename.input1)
		}else if(resultsRename.buttonIndex == 2)
		{
			window.plugins.toast.show('Canceled', 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
		}
	}

    function constructRenameWallet(nameToUse) {
// 		BleApi.displayStatus('Renaming wallet');

        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();

//         var nameToUse = document.getElementById('rename_wallet_input').value;
        console.log("name: " + nameToUse);

        var nameToUseHexed = toHexPadded40bytes(nameToUse);
        console.log("namehexed: " + nameToUseHexed);

		var bb = new ByteBuffer();
        var parseLength = nameToUseHexed.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = nameToUseHexed.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bb.writeUint8(result);
        }
        bb.flip();



        var walletrenameContents = new protoDevice.ChangeWalletName({
        	"wallet_name": bb
        });

        tempBuffer = walletrenameContents.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
	console.log("tempTXstring = " + tempTXstring);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "000F";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);

//         return renameCommand;
    }


////////////////////////////
// Sign Message with address
////////////////////////////

	function signMessageWithDevice() {
		console.log("in signMessageWithDevice ########@@@@@@@@@@@@@@");
        var ProtoBuf = dcodeIO.ProtoBuf;
        var ByteBuffer = dcodeIO.ByteBuffer;
        var builder = ProtoBuf.loadProtoFile("libs/bitlox/messages.proto"),
            Device = builder.build();


	   	var message_string = document.getElementById("sgMsg").value;
	    message_string = fullTrim(message_string);
	    document.getElementById("sgMsgHidden").value = message_string;

		var message_concat_bytes = msg_bytes("Bitcoin Signed Message:\n").concat(msg_bytes(message_string));
		console.log("2b hashed msg bytes: " + message_concat_bytes);

		var message_concat_hex = Crypto.util.bytesToHex(message_concat_bytes);
		console.log("2b hashed msg hex: " +  message_concat_hex);



		address_handle_root = Number(document.getElementById("sgRoot").value);
		address_handle_chain = Number(document.getElementById("sgChain").value);
		address_handle_index = Number(document.getElementById("sgIndex").value);

console.log("address_handle_root " + address_handle_root);
console.log("address_handle_chain " + address_handle_chain);
console.log("address_handle_index " + address_handle_index);

		var bb = new ByteBuffer();
        var parseLength = message_concat_hex.length
// 	console.log("utx length = " + parseLength);
        var i;
        for (i = 0; i < parseLength; i += 2) {
            var value = message_concat_hex.substring(i, i + 2);
// 	console.log("value = " + value);
            var prefix = "0x";
            var together = prefix.concat(value);
// 	console.log("together = " + together);
            var result = parseInt(together);
// 	console.log("result = " + result);

            bb.writeUint8(result);
        }
        bb.flip();

		var txContents = new protoDevice.SignMessage({
		"address_handle_extended":
				{
					"address_handle_root": address_handle_root,
					"address_handle_chain": address_handle_chain,
					"address_handle_index": address_handle_index
				},
		"message_data": bb
// 		,
// 		"message_data": message_string
		});
        tempBuffer = txContents.encode();
        var tempTXstring = tempBuffer.toString('hex');
        document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
// 	console.log("txSize = " + txSize);
// 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
// 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0070";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        console.log("tempTXstring = " + tempTXstring);

        BleApi.app.sliceAndWrite64(tempTXstring);

	}



////////////////////////////
// Send set change address for transaction to follow
// Will only use from the change chain and must be handed the index not the full address.
////////////////////////////

    var setChangeAddress = function(address_handle_index)
    {
        var ProtoBuf2 = dcodeIO.ProtoBuf;
//         var ByteBuffer = dcodeIO.ByteBuffer;
        var builder2 = ProtoBuf2.loadProtoFile("libs/bitlox/messages.proto"),
            Device2 = builder2.build();

        var txContents2 = new Device2.SetChangeAddressIndex({
        	"address_handle_index": parseInt(address_handle_index,10)
        });


        var tempBuffer = txContents2.encode();


        var tempTXstring = tempBuffer.toString('hex');
//         document.getElementById("temp_results").innerHTML = tempTXstring;
        txSize = d2h((tempTXstring.length) / 2).toString('hex');
        // 	console.log("txSize = " + txSize);
        // 	console.log("txSize.length = " + txSize.length);
        var j;
        var txLengthOriginal = txSize.length;
        for (j = 0; j < (8 - txLengthOriginal); j++) {
            var prefix = "0";
            txSize = prefix.concat(txSize);
        }
        // 	console.log("txSizePadded = " + txSize);
        tempTXstring = txSize.concat(tempTXstring);

        var command = "0066";
        tempTXstring = command.concat(tempTXstring);

        var magic = "2323"
        tempTXstring = magic.concat(tempTXstring);
        BleApi.displayStatus('Setting change address');

        BleApi.app.sliceAndWrite64(tempTXstring);
    }



    var sendTransactionForSigning = function() {
        var preppedForDevice = document.getElementById("device_signed_transaction").value;
        // 	console.log("send to device = " + preppedForDevice);
        BleApi.app.sliceAndWrite64(preppedForDevice);
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    // PROTOBUF (end)
    ///////////////////////////////////////////////////////////////////////////////////////





    function compareRIPE160() {
        var areEqual = dev.toUpperCase() === calc.toUpperCase();
        if (areEqual) {
            document.getElementById("RIPEDEVICE").addClass("has-success has-feedback");
        }
    }



    var tempRIPECALC;

    function ecdsaToBase58(publicKeyHex) {
        //could use publicKeyBytesCompressed as well
        var hash160 = Crypto.RIPEMD160(Crypto.util.hexToBytes(Crypto.SHA256(Crypto.util.hexToBytes(publicKeyHex))))

        document.getElementById("ripe160of2_CALC").innerHTML = hash160.toUpperCase();

        var version = 0x00 //if using testnet, would use 0x6F or 111.
        var hashAndBytes = Crypto.util.hexToBytes(hash160)
        hashAndBytes.unshift(version)

        var doubleSHA = Crypto.SHA256(Crypto.util.hexToBytes(Crypto.SHA256(hashAndBytes)))
        var addressChecksum = doubleSHA.substr(0, 8)
            // 		console.log(addressChecksum) //26268187

        var unencodedAddress = "00" + hash160 + addressChecksum

        // 		console.log(unencodedAddress)
        /* output
		  003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187
		*/

        var address = Bitcoin.Base58.encode(Crypto.util.hexToBytes(unencodedAddress))
            // 		console.log("Address58 " + address) //16UjcYNBG9GTK4uq2f7yYEbuifqCzoLMGS
        return address;
    }

    function makeListItems(theList, theID, theContent, theCount, theStart) {
        var myItems = [];
        var myList = $(theList);
        var myContent = theContent;
        var myID = theID;
        var myCount = theCount;
        var myStart = theStart;
        for (var i = myStart; i < myCount; i++) {
            myItems.push("<li><a href=\"#\" id=\"" + myID + "" + i + "\">" + myContent + " " + i + "</a></li>");
            // 			myItems.push( "<li id=\"" + myID + "" + i + "\">" +  myContent + " " + i + "</li>" );

        }

        myList.append(myItems.join(""));
    }

    function loadWalletNames() {
        BleApi.app.sliceAndWrite64(deviceCommands.list_wallets);
    }


    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////
    // BIP32/Bitcoin SPECIFIC
    ///////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////


/**
*	Variables
*/
    var MAINNET_PUBLIC = 0x0488b21e;
    var MAINNET_PRIVATE = 0x0488ade4;
    var TESTNET_PUBLIC = 0x043587cf;
    var TESTNET_PRIVATE = 0x04358394;

    var RECEIVE_CHAIN = 0;
    var CHANGE_CHAIN = 1;
	var addressToNextDisplay = '';
	var indexToNextDisplay = 0;
// ROLLING
    var GAP = 3; // how many extra addresses to generate

    var key = null;
    var network = null;
    var addresses = {
        "receive": {},
        "change": {}
    };;
    var balance = 0;
    var pending = 0;
    var unspent = {};
    var lastone = {
        "receive": GAP,
        "change": GAP
    };
    var chains = {
        "receive": null,
        "change": null
    };
    var usechange = 0;

    var clearData = function() {
        key = null;
        network = null;
        addresses = {
            "receive": {},
            "change": {}
        };
        balance = 0;
        pending = 0;
        unspent = {};
        lastone = {
            "receive": GAP,
            "change": GAP
        };
        chains = {
            "receive": null,
            "change": null
        };
        usechange = 0;

    }

    var ops = Bitcoin.Opcode.map;




    //------------
    // From https://gist.github.com/paolorossi/5747533
    function Queue(handler) {
            var queue = [];

            function run() {
                var callback = function() {
                        queue.shift();
                        // when the handler says it's finished (i.e. runs the callback)
                        // We check for more tasks in the queue and if there are any we run again
                        if (queue.length > 0) {
                            run();
                        }
                    }
                    // give the first item in the queue & the callback to the handler
                handler(queue[0], callback);
            }

            // push the task to the queue. If the queue was empty before the task was pushed
            // we run the task.
            this.append = function(task) {
                queue.push(task);
                if (queue.length === 1) {
                    run();
                }
            }
        }



	// small handler that launch task and calls the callback
	// when its finished
    var queue = new Queue(function(task, callback) {
        task(function() {
            // call an option callback from the task
            if (task.callback)
                task.callback();
            // call the buffer callback.
            callback();
        });
    });



    var getAddr = function(key) {
        var hash160 = key.eckey.getPubKeyHash();
        var addr = new Bitcoin.Address(hash160);
        addr.version = 0x6f; // testnet
        return addr.toString();
    }



    var generate = function() {
        for (var i = 0; i < 12; i++) {
            c = b.derive_child(i);
            childs.push(c);
            addresses.push(getAddr(c));
            $("#results").append(getAddr(c) + "<br>");
        }
    }



    var hashFromAddr = function(string) {
        var bytes = Bitcoin.Base58.decode(string);
        var hash = bytes.slice(0, 21);
        var checksum = Crypto.SHA256(Crypto.SHA256(hash, {
            asBytes: true
        }), {
            asBytes: true
        });

        if (checksum[0] != bytes[21] ||
            checksum[1] != bytes[22] ||
            checksum[2] != bytes[23] ||
            checksum[3] != bytes[24]) {
            throw "Checksum validation failed!";
        }

        this.version = hash.shift();
        this.hash = hash;
        return hash;
    }



    var createOutScript = function(address) {
        var script = new Bitcoin.Script();
        script.writeOp(ops.OP_DUP);
        script.writeOp(ops.OP_HASH160);
        script.writeBytes(hashFromAddr(address));
        script.writeOp(ops.OP_EQUALVERIFY);
        script.writeOp(ops.OP_CHECKSIG);
        return script;
    }



    var valueFromNumber = function(number) {
        var value = BigInteger.valueOf(number * 1e8);
        value = value.toByteArrayUnsigned().reverse();
        while (value.length < 8) value.push(0);
        return value;
    }



    var valueFromSatoshi = function(number) {
        var value = BigInteger.valueOf(number);
        value = value.toByteArrayUnsigned().reverse();
        while (value.length < 8) value.push(0);
        return value;
    }



    var valueFromInteger = function(number) {
        var value = BigInteger.valueOf(number);
        value = value.toByteArrayUnsigned().reverse();
        while (value.length < 4) value.push(0);
        return value;
    }



    var parseScriptString = function(scriptString) {
        var opm = Bitcoin.Opcode.map;
        var inst = scriptString.split(" ");
        var bytescript = [];
        for (thisinst in inst) {
            var part = inst[thisinst];
            if ("string" !== typeof part) {
                continue;
            }
            if ((part.length > 3) && (part.slice(0, 3) == 'OP_')) {
                for (name in opm) {
                    if (name == part) {
                        bytescript.push(opm[name])
                    }
                }
            } else if (part.length > 0) {
                bytescript.push(Bitcoin.Util.hexToBytes(part));
            }
        }
        return bytescript;
    };





    var noUpdate = function(addr) {
        return function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status != 500) {
                console.log(errorThrown);
            } else {
                $("#" + addr).children(".balance").text(0);
                $("#" + addr).children(".pending").text(0);
            }
        }
    }


    var gotUnspent = function(chain, index, addr) {
        return function(data, textStatus, jqXHR) {
        	console.log("chain " + chain);
        	console.log("index " + index);
        	console.log("addr " + addr);
//         	alert("addr " + addr);
			if(chain === "receive"){
				chain_numerical = 0;
				}
				else
				{
				chain_numerical = 1;
				}
//             unspent[addr] = data.unspent_outputs;
            unspent[addr] = data;
//             confirmations[addr] = data.confirmations;
            thisbalance = 0;
            thispending = 0;

            for (var x = 0; x < unspent[addr].length; x++) {
//             alert(unspent[addr][x].confirmations);
                if (unspent[addr][x].confirmations === 0) {											//fix this to withhold unconfirmed
                    thispending += unspent[addr][x].amount * 100000000;
					unspent[addr][x].chain = chain_numerical;
					unspent[addr][x].index = index;
                } else {
                    thisbalance += unspent[addr][x].amount * 100000000;
					unspent[addr][x].chain = chain_numerical;
					unspent[addr][x].index = index;
                }
            }
            balance += thisbalance;
            pending += thispending;
//             $("#balance_display").text(balance / 100000000); // Satoshi to BTC
// 			$("#pending_display").text(pending / 100000000); // Satoshi to BTC
//             $("#pending_display").innerHTML = '&nbsp;&nbsp;&nbsp;['+(pending / 100000000)+' <small>PENDING</small>]'; // Satoshi to BTC
            $("#" + addr).children(".balance").text(thisbalance / 100000000);
            $("#" + addr).children(".pending").text(thispending / 100000000);



//             for (var x = 0; x < unspent[addr].length; x++) {
//                 thisbalance += unspent[addr][x].value;
//                 unspent[addr][x].chain = chain_numerical;
//                 unspent[addr][x].index = index;
//             }
//             balance += thisbalance;
//             $("#balance_display").text(balance / 100000000); // Satoshi to mBTC
//             $("#" + addr).children(".balance").text(thisbalance / 100000000);
        };
    }




    var gotUnspentError = function(chain, index, addr) {
        return function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status != 500) {
                console.log(errorThrown);
            } else {
                $("#" + addr).children(".balance").text(0);
            }
        }
    }

    var checkReceived = function(chain, index, addr, callback) {
        return function(data, textStatus, jqXHR) {
        	console.log('check if EVER received funds on '+chain+' : '  + data);
        	BleApi.displayStatus('Checking balances');
            if (parseInt(data) > 0) {
                var newlast = Math.max(index + GAP + 1, lastone[chain]);
//                 alert("newlast " + newlast);
                lastone[chain] = newlast;
                queue.append(generateAddress(chain, index + 1));


                if (chain === 'receive') {
                	indexToNextDisplay = index + 1;
//                 	alert("iTND "+indexToNextDisplay);
//                 	if (chains[chain]) {
// 						var childkey = chains[chain].derive_child(indexToNextDisplay);
// 						addressToNextDisplay = childkey.eckey.getBitcoinAddress().toString();
// //                 		alert("aTND " + indexToNextDisplay +" "+addressToNextDisplay);
// 					}

                }
                if (chain === 'change') {
                    usechange = index + 1;
                }

                var jqxhr2 = $.get(baseUrl + '/addr/' + addr + '/utxo')
                    .done(gotUnspent(chain, index, addr))
                    .fail(gotUnspentError(chain, index, addr))
                    .always(function() {});
                callback();
            } else {

				$("#balance_display").html((balance / 100000000 ) + "<small> BTC</small>"); // Satoshi to BTC
				$("#" + addr).children(".balance").text(0);

				if(pending !== 0)
				{
					$("#pending_display").html((pending / 100000000) + "<small> PENDING</small>"); // Satoshi to BTC
				}else
				{
					$("#pending_display").html("");
				}
				$("#" + addr).children(".pending").text(0);

                if (index < lastone[chain] - 1) {
                    queue.append(generateAddress(chain, index + 1));
                }else{
        			if (chain === 'receive') {
						requestQRdisplay(indexToNextDisplay);
        			}
                }
                if (index === lastone[chain] - 1) {
					BleApi.displayStatus('Finished balances');
					$("#sendButton").attr('disabled',false);
					$("#receiveButton").attr('disabled',false);
					$("#signMessageButton").attr('disabled',false);
					$("#transactionHistoryButton").attr('disabled',false);
					$('#forceRefresh').attr('disabled',false);
					var theBalance = document.getElementById('balance_display').innerHTML;
					document.getElementById('payment_title').innerHTML = theBalance;
					$('#signAndSendStandard').attr('disabled',false);
                }

                callback();

            }
        };
    }

    var updateBalance = function(chain, index, addr, callback) {
//         var jqxhr = $.get('https://blockchain.info/q/getreceivedbyaddress/' + addr ,{}, 'text')
        var jqxhr = $.get(serverURLio + '/addr/' + addr + '/totalReceived',{}, 'text') // does not return the amount if not confirmed
            .done(checkReceived(chain, index, addr, callback));
    }
// https://blockchain.info/q/getreceivedbyaddress/17XLaSzT7ZpzEJmFvnqEFycoEUXDaXkPcp


	var addressListForMessages = [];
	var addressesMatrix = [];
	var addressesMatrixReceive = [];

    // Simple task to generate addresses and query them;
    var generateAddress = function(chain, index) {
        return function(callback) {
            if (chains[chain]) {
                var childkey = chains[chain].derive_child(index);
                var childaddr = childkey.eckey.getBitcoinAddress().toString();
                var childFront = childaddr.slice(0,17);
                var childBack = childaddr.slice(18,36);

                addressesMatrix.push(childaddr);

                var qrcode = ''
                var qrcode2 = ''
                if (chain === 'receive') {
                    qrcode = ' <br><span class="open-qroverlay glyphicon glyphicon-qrcode glyphicon-qrcode-big" data-toggle="modal" data-target="#qroverlay" data-addr="' + childaddr + '"></span>';
                    qrcode2 = ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="open-sendMsgFrom glyphicon glyphicon-envelope" data-target="#signMessageTab" data-addr="' + childaddr + '" data-index="' + index + '" data-chain="' + chain + '"></span>';
                    addressListForMessages.push({ text: childaddr, value: index });
                    addressesMatrixReceive.push(childaddr);
                }
//                 var row = '<tr id="' + childaddr + '"><td class="iterator">' + index + '</td><td class="address-field">' + '<a href="http://bitlox.io/address/' + childaddr + '" target="_system">' + childFront +'<br>'+ childBack + '</a>' + qrcode + qrcode2 + '</td><td class="balance">?</td></tr>';
                var row = '<tr id="' + childaddr + '"><td class="iterator">' + index + '</td><td class="address-field">' + ' <span class="selectable">' + childFront +'<br>'+ childBack + '</span>' + qrcode + qrcode2 + '</td><td class="balance">?</td>[<td class="pending">?</td>]</tr>';
                // $('#' + chain + '_table').append(row);
                addresses[chain][childaddr] = childkey;

                if (navigator.onLine) {
                    updateBalance(chain, index, childaddr, callback);
                } else {
                    if (index < lastone[chain] - 1) {
                        queue.append(generateAddress(chain, index + 1));
                    }
                    callback();
                }

            } else {
                callback();
            }
        }
    }








  var useNewKey = function(source_key) {
    var keylabel = "";
    var networklabel = "";
    clearData();

    try {
        key = new BIP32(source_key);
    } catch (e) {
        console.log(source_key);
        console.log("Incorrect key?");
    }
    if (key) {
        switch (key.version) {
            case MAINNET_PUBLIC:
                keylabel = "Public key";
                network = 'prod';
                networklabel = "Bitcoin Mainnet";
                break;
            case MAINNET_PRIVATE:
                keylabel = "Private key";
                network = 'prod';
                networklabel = "Bitcoin Mainnet";
                break;
            case TESTNET_PUBLIC:
                keylabel = "Public key";
                network = 'test';
                networklabel = "Bitcoin Testnet";
                break;
            case TESTNET_PRIVATE:
                keylabel = "Private key";
                network = 'test';
                networklabel = "Bitcoin Testnet";
                break;
            default:
                key = null;
                console.log("Unknown key version");
        }
        Bitcoin.setNetwork(network);
    }
    // $("#bip32_key_info_title").text(keylabel);
    // $("#network_label").text(networklabel);

    console.log("key depth: " + key.depth);
    //         window.plugins.toast.show("key depth: " + key.depth, 'short', 'center', function(a){console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});

    if (key.depth != 1) {
        console.error("Non-standard key depth: should be 1, and it is " + key.depth + ", are you sure you want to use that?");
    }

		addressListForMessages.length = 0;
		addressesMatrix.length = 0;
		addressesMatrixReceive.length = 0;

    chains["receive"] = key.derive_child(RECEIVE_CHAIN);
    chains["change"] = key.derive_child(CHANGE_CHAIN);

    queue.append(generateAddress("receive", 0),0);
    queue.append(generateAddress("change", 0),0);
    //         queue.append(getTransactionHistory(0,25),0);
  }




  var onUpdateSourceKey = function() {
      var source_key = $("#bip32_source_key").val();
      useNewKey(source_key);
      //         console.log('balances done');
      //      BleApi.displayStatus('Balances updated');
  };



  }]);

  })(window, window.angular, window.chrome, window.async, window.dcodeIO.ProtoBuf, window.dcodeIO.ByteBuffer, window.cordova, window.evothings, window.device);
