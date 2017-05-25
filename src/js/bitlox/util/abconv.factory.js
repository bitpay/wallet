(function(window, angular) {
    'use strict';

    angular.module('app.util')
        .factory('abconv', abconvFactory);

    function abconvFactory() {
        return {
            toString: ab2hex,
            toArrayBuffer: hex2ab,
            ab2str: ab2str,
            str2ab: str2ab,
            hex2ab: hex2ab,
            hex2abPad: hex2abPad,
            ab2hex: ab2hex,
        };
    }

    function ab2str(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, strLen=str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    function hex2ab(str) {
        var buf = new ArrayBuffer(str.length); // 2 bytes for each char
        var bufView = new Uint16Array(buf);
        for (var i=0, x=0, strLen=str.length; i < strLen; x++, i+=2) {
            var thisByte = str.slice(i, i + 2);
            bufView[x] = parseInt(thisByte, 16);
        }
        return buf;
    }

    function hex2abPad(str, byteLength) {
//         console.debug(str);
        var bytes = new Uint8Array(byteLength);
        str = str.replace(/([a-fA-F0-9]{2})/g, function(match, capture) {
            return String.fromCharCode(parseInt(capture, 16));
        });
        for (var i = 0; i < str.length && i < bytes.length; ++i) {
            if (str.charCodeAt(i) > 255) {
                throw "I am not smart enough to decode non-ASCII data.";
            }
            bytes[i] = str.charCodeAt(i);
        }
        for (i = str.length; i < bytes.length; ++i) {
            bytes[i] = 0;
        }
        return bytes.buffer;
    }

    function ab2hex(buf) {
        var uia = new Uint8Array(buf);
        var hexStr = '';
        uia.forEach(function(ui) {
            var thisStr = ui.toString(16);
            if (thisStr.length === 1) {
                thisStr = '0' + thisStr;
            }
            hexStr += thisStr;
        });
        return hexStr.toUpperCase();
    }

})(window, window.angular);
