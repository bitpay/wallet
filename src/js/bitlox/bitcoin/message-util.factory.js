(function(window, angular, BigInteger, Crypto, Bitcoin, ECPointFp, getSECCurveByName) {
    'use strict';

    angular.module('bitcoin')
        .factory('messageUtil', messageUtilFactory);

    messageUtilFactory.$inject = [];

    function messageUtilFactory() {

        var trimRegexp = /(^[\s\n]+|[\s\n]+$)/g;
        var MESSAGE_HEADER = "Bitcoin Signed Message:\n";

        var messageUtil = {
            trim: trim,
            makeMessageBytes: makeMessageBytes,
            getBytes: getBytes,
            processSignature: processSignature,
            MESSAGE_HEADER: MESSAGE_HEADER,
        };

        return messageUtil;

        function makeMessageBytes(message) {
            message = trim(message);
            return getBytes(MESSAGE_HEADER).concat(getBytes(message));
        }

        function trim(message) {
            return message.replace(trimRegexp, '');
        }

        function getBytes(str) {
            var bytes = Crypto.charenc.UTF8.stringToBytes(str);
            var len = bytes.length;
            if (len < 0xfd) { // 253
                bytes = [len].concat(bytes);
            } else if (len < 0xffff) { // 65535
                // ignore this line in jshint, it does not like
                // bitwise operations
                bytes = [0xfd, len & 0xff, len >>> 0x8].concat(bytes); // jshint ignore:line
            } else {
                throw new Error("Message to large");
            }
            return bytes;
        }

        function processSignature(message, address, sigBytes, compressed, addrType) {
            addrType = addrType || 0;
            if (compressed === undefined) {
                compressed = true;
            }
            var parsed = Bitcoin.ECDSA.parseSig(sigBytes);
            var sequence = [0];
            sequence = sequence.concat(parsed.r.toByteArrayUnsigned());
            sequence = sequence.concat(parsed.s.toByteArrayUnsigned());
            for (var i = 0; i < 4; i++) {
                var nV = 27 + i;
                if (compressed) {
                    console.debug("processSignature: is compressed");
                    nV += 4;
                }
                sequence[0] = nV;
                var sig = Crypto.util.bytesToBase64(sequence);
                var sigAddress = verifyMessage(sig, message, addrType);
                console.debug("processSignature: got sigAddress", sigAddress, "address=", address);
                if (sigAddress === address) {
                    console.debug("processSignature: found match");
                    return sig;
                }
            }
            console.debug("processSignature: no match found");
            return false;
        }

        function msgDigest(message) {
            var bytes = makeMessageBytes(message);
            return Crypto.SHA256(Crypto.SHA256(bytes, {asBytes:true}), {asBytes:true});
        }

        function verifyMessage(signature, message, addrtype) {
            var sig;
            try {
                sig = Crypto.util.base64ToBytes(signature);
            } catch(err) {
                console.error(err, signature);
                return false;
            }

            if (sig.length !== 65){
                console.error("Invalid sig length", sig.length, sig);
                return false;
	        }
            // extract r,s from signature
            var r = BigInteger.fromByteArrayUnsigned(sig.slice(1,1+32));
            var s = BigInteger.fromByteArrayUnsigned(sig.slice(33,33+32));

            // get recid
            var compressed = false;
            var nV = sig[0];
            if (nV < 27 || nV >= 35){
    	        console.error("nV error");
                return false;
            }
            if (nV >= 31) {
                compressed = true;
                nV -= 4;
            }
            var recid = BigInteger.valueOf(nV - 27);

            var ecparams = getSECCurveByName("secp256k1");
            var curve = ecparams.getCurve();
            var a = curve.getA().toBigInteger();
            var b = curve.getB().toBigInteger();
            var p = curve.getQ();
            var G = ecparams.getG();
            var order = ecparams.getN();

            var x = r.add(order.multiply(recid.divide(BigInteger.valueOf(2))));
            var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
            var beta = alpha.modPow(p.add(BigInteger.ONE).divide(BigInteger.valueOf(4)), p);
            var y = beta.subtract(recid).isEven() ? beta : p.subtract(beta);

            var R = new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
            var e = BigInteger.fromByteArrayUnsigned(msgDigest(message));
            var minus_e = e.negate().mod(order);
            var inv_r = r.modInverse(order);
            var Q = (R.multiply(s).add(G.multiply(minus_e))).multiply(inv_r);

            var public_key = Q.getEncoded(compressed);
            var addr = new Bitcoin.Address(Bitcoin.Util.sha256ripe160(public_key));
            addr.version = addrtype ? addrtype : 0;
            return addr.toString();
        }

    }

})(window, window.angular, window.BigInteger, window.Crypto, window.Bitcoin, window.ECPointFp, window.getSECCurveByName);
