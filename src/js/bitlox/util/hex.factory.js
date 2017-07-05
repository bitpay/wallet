(function(window, angular, Crypto, ByteBuffer, BigInteger) {
    'use strict';

    angular.module('app.util')
        .factory('hexUtil', HexFactory);

    HexFactory.$inject = [];

    function HexFactory() {
        return {
            // string to hex methods
            utf8ToHex: utf8ToHex,
            // alias this
            toHex: utf8ToHex,
            toPaddedHex: strToPaddedHex,
            // hex manipulation/conversion methods
            padBytes: padBytes,
            hexToByteBuffer: hexToByteBuffer,
            // hex values
            intToBigEndianValue: intToBigEndianValue,
            intToBigEndianString: intToBigEndianString,
            // byte to hex methods
            bytesToHex: bytesToHex,
            hexToBytes: hexToBytes,
            // make a big endian string small endian
            makeStringSmallEndian: makeStringSmallEndian
        };

        function strToPaddedHex(str, targetBytes, padByte) {
            return padBytes(utf8ToHex(str), targetBytes, padByte);
        }

        function utf8ToHex(str) {
		    return bytesToHex(Crypto.charenc.UTF8.stringToBytes(str));
        }

        function bytesToHex(bytes) {
		    return Crypto.util.bytesToHex(bytes);
        }

        function hexToBytes(hex) {
            return Crypto.util.hexToBytes(hex);
        }

        function padBytes(hex, targetBytes, padByte) {
            if (padByte === undefined) {
                padByte = '20';
            }
            if (padByte.length !== 2) {
                throw new Error("Invalid padding byte " + padByte);
            }
            if (isNaN(targetBytes)) {
                throw new Error("Invalid target bytes " + padByte);
            }
            while (hex.length < (targetBytes * 2)) {
                hex += padByte;
            }
            return hex;
        }

        function hexToByteBuffer(hex) {
            // console.debug("converting to byte buffer");
            // console.debug(hex)
            // console.debug(hex.toString('hex'))
            var buf = new ByteBuffer();
            var hexLen = hex.length;
            for(var i = 0; i < hexLen; i+=2) {
                var value = hex.substring(i, i + 2);
                var result = parseInt(value, 16);
                buf.writeUint8(result);
            }
            return buf;
        }

        function intToBigEndianValue(n, minBytes) {
//             n = BigInteger.valueOf(n); // this returns a wrong value when an input is more than 42.9 BTC
            n = new BigInteger(n.toString());
            var value = n.toByteArrayUnsigned().reverse();
            while (value.length < minBytes) {
                value.push(0);
            }
            return value;
        }

        function intToBigEndianString(n, minBytes) {
            return bytesToHex(intToBigEndianValue(n, minBytes));
        }

        function makeStringSmallEndian(str) {
            var smallEndian = '';
            for (var i = (str.length - 2); i >= 0; i -= 2) {
                var byteChars = str.slice(i, i + 2);
                smallEndian += byteChars;
            }
            return smallEndian;
        }
    }

})(window, window.angular, window.Crypto, window.dcodeIO.ByteBuffer, window.BigInteger);
