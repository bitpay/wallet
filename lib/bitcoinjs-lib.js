if (typeof(window) == 'undefined') {
  window = global;
  window.navigator = {};
}
window.Bitcoin = {};
if (typeof Crypto == "undefined" || ! Crypto.util)

{

(function(){



var base64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";



// Global Crypto object

var Crypto = window.Crypto = {};



// Crypto utilities

var util = Crypto.util = {



	// Bit-wise rotate left

	rotl: function (n, b) {

		return (n << b) | (n >>> (32 - b));

	},



	// Bit-wise rotate right

	rotr: function (n, b) {

		return (n << (32 - b)) | (n >>> b);

	},



	// Swap big-endian to little-endian and vice versa

	endian: function (n) {



		// If number given, swap endian

		if (n.constructor == Number) {

			return util.rotl(n,  8) & 0x00FF00FF |

			       util.rotl(n, 24) & 0xFF00FF00;

		}



		// Else, assume array and swap all items

		for (var i = 0; i < n.length; i++)

			n[i] = util.endian(n[i]);

		return n;



	},



	// Generate an array of any length of random bytes

	randomBytes: function (n) {

		for (var bytes = []; n > 0; n--)

			bytes.push(Math.floor(Math.random() * 256));

		return bytes;

	},



	// Convert a byte array to big-endian 32-bit words

	bytesToWords: function (bytes) {

		for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)

			words[b >>> 5] |= (bytes[i] & 0xFF) << (24 - b % 32);

		return words;

	},



	// Convert big-endian 32-bit words to a byte array

	wordsToBytes: function (words) {

		for (var bytes = [], b = 0; b < words.length * 32; b += 8)

			bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);

		return bytes;

	},



	// Convert a byte array to a hex string

	bytesToHex: function (bytes) {

		for (var hex = [], i = 0; i < bytes.length; i++) {

			hex.push((bytes[i] >>> 4).toString(16));

			hex.push((bytes[i] & 0xF).toString(16));

		}

		return hex.join("");

	},



	// Convert a hex string to a byte array

	hexToBytes: function (hex) {

		for (var bytes = [], c = 0; c < hex.length; c += 2)

			bytes.push(parseInt(hex.substr(c, 2), 16));

		return bytes;

	},



	// Convert a byte array to a base-64 string

	bytesToBase64: function (bytes) {

		for(var base64 = [], i = 0; i < bytes.length; i += 3) {

			var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

			for (var j = 0; j < 4; j++) {

				if (i * 8 + j * 6 <= bytes.length * 8)

					base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));

				else base64.push("=");

			}

		}



		return base64.join("");

	},



	// Convert a base-64 string to a byte array

	base64ToBytes: function (base64) {

		// Remove non-base-64 characters

		base64 = base64.replace(/[^A-Z0-9+\/]/ig, "");



		for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {

			if (imod4 == 0) continue;

			bytes.push(((base64map.indexOf(base64.charAt(i - 1)) & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2)) |

			           (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));

		}



		return bytes;

	}



};



// Crypto character encodings

var charenc = Crypto.charenc = {};



// UTF-8 encoding

var UTF8 = charenc.UTF8 = {



	// Convert a string to a byte array

	stringToBytes: function (str) {

		return Binary.stringToBytes(unescape(encodeURIComponent(str)));

	},



	// Convert a byte array to a string

	bytesToString: function (bytes) {

		return decodeURIComponent(escape(Binary.bytesToString(bytes)));

	}



};



// Binary encoding

var Binary = charenc.Binary = {



	// Convert a string to a byte array

	stringToBytes: function (str) {

		for (var bytes = [], i = 0; i < str.length; i++)

			bytes.push(str.charCodeAt(i) & 0xFF);

		return bytes;

	},



	// Convert a byte array to a string

	bytesToString: function (bytes) {

		for (var str = [], i = 0; i < bytes.length; i++)

			str.push(String.fromCharCode(bytes[i]));

		return str.join("");

	}



};



})();

}

(function(){



// Shortcut

var util = Crypto.util;



// Convert n to unsigned 32-bit integer

util.u32 = function (n) {

	return n >>> 0;

};



// Unsigned 32-bit addition

util.add = function () {

	var result = this.u32(arguments[0]);

	for (var i = 1; i < arguments.length; i++)

		result = this.u32(result + this.u32(arguments[i]));

	return result;

};



// Unsigned 32-bit multiplication

util.mult = function (m, n) {

	return this.add((n & 0xFFFF0000) * m,

			(n & 0x0000FFFF) * m);

};



// Unsigned 32-bit greater than (>) comparison

util.gt = function (m, n) {

	return this.u32(m) > this.u32(n);

};



// Unsigned 32-bit less than (<) comparison

util.lt = function (m, n) {

	return this.u32(m) < this.u32(n);

};



})();

/*!

 * Crypto-JS contribution from Simon Greatrix

 */



(function(C){



// Create pad namespace

var C_pad = C.pad = {};



// Calculate the number of padding bytes required.

function _requiredPadding(cipher, message) {

    var blockSizeInBytes = cipher._blocksize * 4;

    var reqd = blockSizeInBytes - message.length % blockSizeInBytes;

    return reqd;

}



// Remove padding when the final byte gives the number of padding bytes.

var _unpadLength = function(cipher, message, alg, padding) {

	var pad = message.pop();

	if (pad == 0) {

		throw new Error("Invalid zero-length padding specified for " + alg

				+ ". Wrong cipher specification or key used?");

	}

	var maxPad = cipher._blocksize * 4;

	if (pad > maxPad) {

		throw new Error("Invalid padding length of " + pad

				+ " specified for " + alg

				+ ". Wrong cipher specification or key used?");

	}

	for ( var i = 1; i < pad; i++) {

		var b = message.pop();

		if (padding != undefined && padding != b) {

			throw new Error("Invalid padding byte of 0x" + b.toString(16)

					+ " specified for " + alg

					+ ". Wrong cipher specification or key used?");

		}

	}

};



// No-operation padding, used for stream ciphers

C_pad.NoPadding = {

        pad : function (cipher,message) {},

        unpad : function (cipher,message) {}

    };



// Zero Padding.

//

// If the message is not an exact number of blocks, the final block is

// completed with 0x00 bytes. There is no unpadding.

C_pad.ZeroPadding = {

    pad : function (cipher, message) {

        var blockSizeInBytes = cipher._blocksize * 4;

        var reqd = message.length % blockSizeInBytes;

        if( reqd!=0 ) {

            for(reqd = blockSizeInBytes - reqd; reqd>0; reqd--) {

                message.push(0x00);

            }

        }

    },



    unpad : function (cipher, message) {

        while (message[message.length - 1] == 0) {

            message.pop();

        }

    }

};



// ISO/IEC 7816-4 padding.

//

// Pads the plain text with an 0x80 byte followed by as many 0x00

// bytes are required to complete the block.

C_pad.iso7816 = {

    pad : function (cipher, message) {

        var reqd = _requiredPadding(cipher, message);

        message.push(0x80);

        for (; reqd > 1; reqd--) {

            message.push(0x00);

        }

    },



    unpad : function (cipher, message) {

    	var padLength;

    	for(padLength = cipher._blocksize * 4; padLength>0; padLength--) {

    		var b = message.pop();

    		if( b==0x80 ) return;

    		if( b!=0x00 ) {

    			throw new Error("ISO-7816 padding byte must be 0, not 0x"+b.toString(16)+". Wrong cipher specification or key used?");

    		}

    	}

    	throw new Error("ISO-7816 padded beyond cipher block size. Wrong cipher specification or key used?");

    }

};



// ANSI X.923 padding

//

// The final block is padded with zeros except for the last byte of the

// last block which contains the number of padding bytes.

C_pad.ansix923 = {

    pad : function (cipher, message) {

        var reqd = _requiredPadding(cipher, message);

        for (var i = 1; i < reqd; i++) {

            message.push(0x00);

        }

        message.push(reqd);

    },



    unpad : function (cipher,message) {

    	_unpadLength(cipher,message,"ANSI X.923",0);

    }

};



// ISO 10126

//

// The final block is padded with random bytes except for the last

// byte of the last block which contains the number of padding bytes.

C_pad.iso10126 = {

    pad : function (cipher, message) {

        var reqd = _requiredPadding(cipher, message);

        for (var i = 1; i < reqd; i++) {

            message.push(Math.floor(Math.random() * 256));

        }

        message.push(reqd);

    },



    unpad : function (cipher,message) {

    	_unpadLength(cipher,message,"ISO 10126",undefined);

    }

};



// PKCS7 padding

//

// PKCS7 is described in RFC 5652. Padding is in whole bytes. The

// value of each added byte is the number of bytes that are added,

// i.e. N bytes, each of value N are added.

C_pad.pkcs7 = {

    pad : function (cipher, message) {

        var reqd = _requiredPadding(cipher, message);

        for (var i = 0; i < reqd; i++) {

            message.push(reqd);

        }

    },



    unpad : function (cipher,message) {

    	_unpadLength(cipher,message,"PKCS 7",message[message.length-1]);

    }

};



// Create mode namespace

var C_mode = C.mode = {};



/**

 * Mode base "class".

 */

var Mode = C_mode.Mode = function (padding) {

    if (padding) {

        this._padding = padding;

    }

};



Mode.prototype = {

    encrypt: function (cipher, m, iv) {

        this._padding.pad(cipher, m);

        this._doEncrypt(cipher, m, iv);

    },



    decrypt: function (cipher, m, iv) {

        this._doDecrypt(cipher, m, iv);

        this._padding.unpad(cipher, m);

    },



    // Default padding

    _padding: C_pad.iso7816

};





/**

 * Electronic Code Book mode.

 * 

 * ECB applies the cipher directly against each block of the input.

 * 

 * ECB does not require an initialization vector.

 */

var ECB = C_mode.ECB = function () {

    // Call parent constructor

    Mode.apply(this, arguments);

};



// Inherit from Mode

var ECB_prototype = ECB.prototype = new Mode;



// Concrete steps for Mode template

ECB_prototype._doEncrypt = function (cipher, m, iv) {

    var blockSizeInBytes = cipher._blocksize * 4;

    // Encrypt each block

    for (var offset = 0; offset < m.length; offset += blockSizeInBytes) {

        cipher._encryptblock(m, offset);

    }

};

ECB_prototype._doDecrypt = function (cipher, c, iv) {

    var blockSizeInBytes = cipher._blocksize * 4;

    // Decrypt each block

    for (var offset = 0; offset < c.length; offset += blockSizeInBytes) {

        cipher._decryptblock(c, offset);

    }

};



// ECB never uses an IV

ECB_prototype.fixOptions = function (options) {

    options.iv = [];

};





/**

 * Cipher block chaining

 * 

 * The first block is XORed with the IV. Subsequent blocks are XOR with the

 * previous cipher output.

 */

var CBC = C_mode.CBC = function () {

    // Call parent constructor

    Mode.apply(this, arguments);

};



// Inherit from Mode

var CBC_prototype = CBC.prototype = new Mode;



// Concrete steps for Mode template

CBC_prototype._doEncrypt = function (cipher, m, iv) {

    var blockSizeInBytes = cipher._blocksize * 4;



    // Encrypt each block

    for (var offset = 0; offset < m.length; offset += blockSizeInBytes) {

        if (offset == 0) {

            // XOR first block using IV

            for (var i = 0; i < blockSizeInBytes; i++)

            m[i] ^= iv[i];

        } else {

            // XOR this block using previous crypted block

            for (var i = 0; i < blockSizeInBytes; i++)

            m[offset + i] ^= m[offset + i - blockSizeInBytes];

        }

        // Encrypt block

        cipher._encryptblock(m, offset);

    }

};

CBC_prototype._doDecrypt = function (cipher, c, iv) {

    var blockSizeInBytes = cipher._blocksize * 4;



    // At the start, the previously crypted block is the IV

    var prevCryptedBlock = iv;



    // Decrypt each block

    for (var offset = 0; offset < c.length; offset += blockSizeInBytes) {

        // Save this crypted block

        var thisCryptedBlock = c.slice(offset, offset + blockSizeInBytes);

        // Decrypt block

        cipher._decryptblock(c, offset);

        // XOR decrypted block using previous crypted block

        for (var i = 0; i < blockSizeInBytes; i++) {

            c[offset + i] ^= prevCryptedBlock[i];

        }

        prevCryptedBlock = thisCryptedBlock;

    }

};





/**

 * Cipher feed back

 * 

 * The cipher output is XORed with the plain text to produce the cipher output,

 * which is then fed back into the cipher to produce a bit pattern to XOR the

 * next block with.

 * 

 * This is a stream cipher mode and does not require padding.

 */

var CFB = C_mode.CFB = function () {

    // Call parent constructor

    Mode.apply(this, arguments);

};



// Inherit from Mode

var CFB_prototype = CFB.prototype = new Mode;



// Override padding

CFB_prototype._padding = C_pad.NoPadding;



// Concrete steps for Mode template

CFB_prototype._doEncrypt = function (cipher, m, iv) {

    var blockSizeInBytes = cipher._blocksize * 4,

        keystream = iv.slice(0);



    // Encrypt each byte

    for (var i = 0; i < m.length; i++) {



        var j = i % blockSizeInBytes;

        if (j == 0) cipher._encryptblock(keystream, 0);



        m[i] ^= keystream[j];

        keystream[j] = m[i];

    }

};

CFB_prototype._doDecrypt = function (cipher, c, iv) {

    var blockSizeInBytes = cipher._blocksize * 4,

        keystream = iv.slice(0);



    // Encrypt each byte

    for (var i = 0; i < c.length; i++) {



        var j = i % blockSizeInBytes;

        if (j == 0) cipher._encryptblock(keystream, 0);



        var b = c[i];

        c[i] ^= keystream[j];

        keystream[j] = b;

    }

};





/**

 * Output feed back

 * 

 * The cipher repeatedly encrypts its own output. The output is XORed with the

 * plain text to produce the cipher text.

 * 

 * This is a stream cipher mode and does not require padding.

 */

var OFB = C_mode.OFB = function () {

    // Call parent constructor

    Mode.apply(this, arguments);

};



// Inherit from Mode

var OFB_prototype = OFB.prototype = new Mode;



// Override padding

OFB_prototype._padding = C_pad.NoPadding;



// Concrete steps for Mode template

OFB_prototype._doEncrypt = function (cipher, m, iv) {



    var blockSizeInBytes = cipher._blocksize * 4,

        keystream = iv.slice(0);



    // Encrypt each byte

    for (var i = 0; i < m.length; i++) {



        // Generate keystream

        if (i % blockSizeInBytes == 0)

            cipher._encryptblock(keystream, 0);



        // Encrypt byte

        m[i] ^= keystream[i % blockSizeInBytes];



    }

};

OFB_prototype._doDecrypt = OFB_prototype._doEncrypt;



/**

 * Counter

 * @author Gergely Risko

 *

 * After every block the last 4 bytes of the IV is increased by one

 * with carry and that IV is used for the next block.

 *

 * This is a stream cipher mode and does not require padding.

 */

var CTR = C_mode.CTR = function () {

    // Call parent constructor

    Mode.apply(this, arguments);

};



// Inherit from Mode

var CTR_prototype = CTR.prototype = new Mode;



// Override padding

CTR_prototype._padding = C_pad.NoPadding;



CTR_prototype._doEncrypt = function (cipher, m, iv) {

    var blockSizeInBytes = cipher._blocksize * 4;

    var counter = iv.slice(0);



    for (var i = 0; i < m.length;) {

        // do not lose iv

        var keystream = counter.slice(0);



        // Generate keystream for next block

        cipher._encryptblock(keystream, 0);



        // XOR keystream with block

        for (var j = 0; i < m.length && j < blockSizeInBytes; j++, i++) {

            m[i] ^= keystream[j];

        }



        // Increase counter

        if(++(counter[blockSizeInBytes-1]) == 256) {

            counter[blockSizeInBytes-1] = 0;

            if(++(counter[blockSizeInBytes-2]) == 256) {

                counter[blockSizeInBytes-2] = 0;

                if(++(counter[blockSizeInBytes-3]) == 256) {

                    counter[blockSizeInBytes-3] = 0;

                    ++(counter[blockSizeInBytes-4]);

                }

            }

        }

    }

};

CTR_prototype._doDecrypt = CTR_prototype._doEncrypt;



})(Crypto);

(function(){



// Shortcuts

var C = Crypto,

    util = C.util,

    charenc = C.charenc,

    UTF8 = charenc.UTF8,

    Binary = charenc.Binary;



// Constants

var K = [ 0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,

          0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,

          0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,

          0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,

          0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,

          0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,

          0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,

          0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,

          0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,

          0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,

          0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,

          0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,

          0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,

          0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,

          0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,

          0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2 ];



// Public API

var SHA256 = C.SHA256 = function (message, options) {

	var digestbytes = util.wordsToBytes(SHA256._sha256(message));

	return options && options.asBytes ? digestbytes :

	       options && options.asString ? Binary.bytesToString(digestbytes) :

	       util.bytesToHex(digestbytes);

};



// The core

SHA256._sha256 = function (message) {



	// Convert to byte array

	if (message.constructor == String) message = UTF8.stringToBytes(message);

	/* else, assume byte array already */



	var m = util.bytesToWords(message),

	    l = message.length * 8,

	    H = [ 0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,

	          0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19 ],

	    w = [],

	    a, b, c, d, e, f, g, h, i, j,

	    t1, t2;



	// Padding

	m[l >> 5] |= 0x80 << (24 - l % 32);

	m[((l + 64 >> 9) << 4) + 15] = l;



	for (var i = 0; i < m.length; i += 16) {



		a = H[0];

		b = H[1];

		c = H[2];

		d = H[3];

		e = H[4];

		f = H[5];

		g = H[6];

		h = H[7];



		for (var j = 0; j < 64; j++) {



			if (j < 16) w[j] = m[j + i];

			else {



				var gamma0x = w[j - 15],

				    gamma1x = w[j - 2],

				    gamma0  = ((gamma0x << 25) | (gamma0x >>>  7)) ^

				              ((gamma0x << 14) | (gamma0x >>> 18)) ^

				               (gamma0x >>> 3),

				    gamma1  = ((gamma1x <<  15) | (gamma1x >>> 17)) ^

				              ((gamma1x <<  13) | (gamma1x >>> 19)) ^

				               (gamma1x >>> 10);



				w[j] = gamma0 + (w[j - 7] >>> 0) +

				       gamma1 + (w[j - 16] >>> 0);



			}



			var ch  = e & f ^ ~e & g,

			    maj = a & b ^ a & c ^ b & c,

			    sigma0 = ((a << 30) | (a >>>  2)) ^

			             ((a << 19) | (a >>> 13)) ^

			             ((a << 10) | (a >>> 22)),

			    sigma1 = ((e << 26) | (e >>>  6)) ^

			             ((e << 21) | (e >>> 11)) ^

			             ((e <<  7) | (e >>> 25));





			t1 = (h >>> 0) + sigma1 + ch + (K[j]) + (w[j] >>> 0);

			t2 = sigma0 + maj;



			h = g;

			g = f;

			f = e;

			e = (d + t1) >>> 0;

			d = c;

			c = b;

			b = a;

			a = (t1 + t2) >>> 0;



		}



		H[0] += a;

		H[1] += b;

		H[2] += c;

		H[3] += d;

		H[4] += e;

		H[5] += f;

		H[6] += g;

		H[7] += h;



	}



	return H;



};



// Package private blocksize

SHA256._blocksize = 16;



SHA256._digestsize = 32;



})();

(function(){



// Shortcuts

var C = Crypto,

    util = C.util,

    charenc = C.charenc,

    UTF8 = charenc.UTF8;



// Precomputed SBOX

var SBOX = [ 0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5,

             0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,

             0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0,

             0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,

             0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc,

             0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,

             0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a,

             0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,

             0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0,

             0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,

             0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b,

             0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,

             0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,

             0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,

             0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,

             0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,

             0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17,

             0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,

             0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88,

             0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,

             0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c,

             0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,

             0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9,

             0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,

             0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6,

             0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,

             0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e,

             0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,

             0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94,

             0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,

             0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68,

             0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16 ];



// Compute inverse SBOX lookup table

for (var INVSBOX = [], i = 0; i < 256; i++) INVSBOX[SBOX[i]] = i;



// Compute multiplication in GF(2^8) lookup tables

var MULT2 = [],

    MULT3 = [],

    MULT9 = [],

    MULTB = [],

    MULTD = [],

    MULTE = [];



function xtime(a, b) {

	for (var result = 0, i = 0; i < 8; i++) {

		if (b & 1) result ^= a;

		var hiBitSet = a & 0x80;

		a = (a << 1) & 0xFF;

		if (hiBitSet) a ^= 0x1b;

		b >>>= 1;

	}

	return result;

}



for (var i = 0; i < 256; i++) {

	MULT2[i] = xtime(i,2);

	MULT3[i] = xtime(i,3);

	MULT9[i] = xtime(i,9);

	MULTB[i] = xtime(i,0xB);

	MULTD[i] = xtime(i,0xD);

	MULTE[i] = xtime(i,0xE);

}



// Precomputed RCon lookup

var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];



// Inner state

var state = [[], [], [], []],

    keylength,

    nrounds,

    keyschedule;



var AES = C.AES = {



	/**

	 * Public API

	 */



	encrypt: function (message, password, options) {



		options = options || {};



		// Determine mode

		var mode = options.mode || new C.mode.OFB;



		// Allow mode to override options

		if (mode.fixOptions) mode.fixOptions(options);



		var



			// Convert to bytes if message is a string

			m = (

				message.constructor == String ?

				UTF8.stringToBytes(message) :

				message

			),



			// Generate random IV

			iv = options.iv || util.randomBytes(AES._blocksize * 4),



			// Generate key

			k = (

				password.constructor == String ?

				// Derive key from pass-phrase

				C.PBKDF2(password, iv, 32, { asBytes: true }) :

				// else, assume byte array representing cryptographic key

				password

			);



		// Encrypt

		AES._init(k);

		mode.encrypt(AES, m, iv);



		// Return ciphertext

		m = options.iv ? m : iv.concat(m);

		return (options && options.asBytes) ? m : util.bytesToBase64(m);



	},



	decrypt: function (ciphertext, password, options) {



		options = options || {};



		// Determine mode

		var mode = options.mode || new C.mode.OFB;



		// Allow mode to override options

		if (mode.fixOptions) mode.fixOptions(options);



		var



			// Convert to bytes if ciphertext is a string

			c = (

				ciphertext.constructor == String ?

				util.base64ToBytes(ciphertext):

			    ciphertext

			),



			// Separate IV and message

			iv = options.iv || c.splice(0, AES._blocksize * 4),



			// Generate key

			k = (

				password.constructor == String ?

				// Derive key from pass-phrase

				C.PBKDF2(password, iv, 32, { asBytes: true }) :

				// else, assume byte array representing cryptographic key

				password

			);



		// Decrypt

		AES._init(k);

		mode.decrypt(AES, c, iv);



		// Return plaintext

		return (options && options.asBytes) ? c : UTF8.bytesToString(c);



	},





	/**

	 * Package private methods and properties

	 */



	_blocksize: 4,



	_encryptblock: function (m, offset) {



		// Set input

		for (var row = 0; row < AES._blocksize; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] = m[offset + col * 4 + row];

		}



		// Add round key

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] ^= keyschedule[col][row];

		}



		for (var round = 1; round < nrounds; round++) {



			// Sub bytes

			for (var row = 0; row < 4; row++) {

				for (var col = 0; col < 4; col++)

					state[row][col] = SBOX[state[row][col]];

			}



			// Shift rows

			state[1].push(state[1].shift());

			state[2].push(state[2].shift());

			state[2].push(state[2].shift());

			state[3].unshift(state[3].pop());



			// Mix columns

			for (var col = 0; col < 4; col++) {



				var s0 = state[0][col],

				    s1 = state[1][col],

				    s2 = state[2][col],

				    s3 = state[3][col];



				state[0][col] = MULT2[s0] ^ MULT3[s1] ^ s2 ^ s3;

				state[1][col] = s0 ^ MULT2[s1] ^ MULT3[s2] ^ s3;

				state[2][col] = s0 ^ s1 ^ MULT2[s2] ^ MULT3[s3];

				state[3][col] = MULT3[s0] ^ s1 ^ s2 ^ MULT2[s3];



			}



			// Add round key

			for (var row = 0; row < 4; row++) {

				for (var col = 0; col < 4; col++)

					state[row][col] ^= keyschedule[round * 4 + col][row];

			}



		}



		// Sub bytes

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] = SBOX[state[row][col]];

		}



		// Shift rows

		state[1].push(state[1].shift());

		state[2].push(state[2].shift());

		state[2].push(state[2].shift());

		state[3].unshift(state[3].pop());



		// Add round key

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] ^= keyschedule[nrounds * 4 + col][row];

		}



		// Set output

		for (var row = 0; row < AES._blocksize; row++) {

			for (var col = 0; col < 4; col++)

				m[offset + col * 4 + row] = state[row][col];

		}



	},



	_decryptblock: function (c, offset) {



		// Set input

		for (var row = 0; row < AES._blocksize; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] = c[offset + col * 4 + row];

		}



		// Add round key

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] ^= keyschedule[nrounds * 4 + col][row];

		}



		for (var round = 1; round < nrounds; round++) {



			// Inv shift rows

			state[1].unshift(state[1].pop());

			state[2].push(state[2].shift());

			state[2].push(state[2].shift());

			state[3].push(state[3].shift());



			// Inv sub bytes

			for (var row = 0; row < 4; row++) {

				for (var col = 0; col < 4; col++)

					state[row][col] = INVSBOX[state[row][col]];

			}



			// Add round key

			for (var row = 0; row < 4; row++) {

				for (var col = 0; col < 4; col++)

					state[row][col] ^= keyschedule[(nrounds - round) * 4 + col][row];

			}



			// Inv mix columns

			for (var col = 0; col < 4; col++) {



				var s0 = state[0][col],

				    s1 = state[1][col],

				    s2 = state[2][col],

				    s3 = state[3][col];



				state[0][col] = MULTE[s0] ^ MULTB[s1] ^ MULTD[s2] ^ MULT9[s3];

				state[1][col] = MULT9[s0] ^ MULTE[s1] ^ MULTB[s2] ^ MULTD[s3];

				state[2][col] = MULTD[s0] ^ MULT9[s1] ^ MULTE[s2] ^ MULTB[s3];

				state[3][col] = MULTB[s0] ^ MULTD[s1] ^ MULT9[s2] ^ MULTE[s3];



			}



		}



		// Inv shift rows

		state[1].unshift(state[1].pop());

		state[2].push(state[2].shift());

		state[2].push(state[2].shift());

		state[3].push(state[3].shift());



		// Inv sub bytes

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] = INVSBOX[state[row][col]];

		}



		// Add round key

		for (var row = 0; row < 4; row++) {

			for (var col = 0; col < 4; col++)

				state[row][col] ^= keyschedule[col][row];

		}



		// Set output

		for (var row = 0; row < AES._blocksize; row++) {

			for (var col = 0; col < 4; col++)

				c[offset + col * 4 + row] = state[row][col];

		}



	},





	/**

	 * Private methods

	 */



	_init: function (k) {

		keylength = k.length / 4;

		nrounds = keylength + 6;

		AES._keyexpansion(k);

	},



	// Generate a key schedule

	_keyexpansion: function (k) {



		keyschedule = [];



		for (var row = 0; row < keylength; row++) {

			keyschedule[row] = [

				k[row * 4],

				k[row * 4 + 1],

				k[row * 4 + 2],

				k[row * 4 + 3]

			];

		}



		for (var row = keylength; row < AES._blocksize * (nrounds + 1); row++) {



			var temp = [

				keyschedule[row - 1][0],

				keyschedule[row - 1][1],

				keyschedule[row - 1][2],

				keyschedule[row - 1][3]

			];



			if (row % keylength == 0) {



				// Rot word

				temp.push(temp.shift());



				// Sub word

				temp[0] = SBOX[temp[0]];

				temp[1] = SBOX[temp[1]];

				temp[2] = SBOX[temp[2]];

				temp[3] = SBOX[temp[3]];



				temp[0] ^= RCON[row / keylength];



			} else if (keylength > 6 && row % keylength == 4) {



				// Sub word

				temp[0] = SBOX[temp[0]];

				temp[1] = SBOX[temp[1]];

				temp[2] = SBOX[temp[2]];

				temp[3] = SBOX[temp[3]];



			}



			keyschedule[row] = [

				keyschedule[row - keylength][0] ^ temp[0],

				keyschedule[row - keylength][1] ^ temp[1],

				keyschedule[row - keylength][2] ^ temp[2],

				keyschedule[row - keylength][3] ^ temp[3]

			];



		}



	}



};



})();

(function(){



// Shortcuts

var C = Crypto,

    util = C.util,

    charenc = C.charenc,

    UTF8 = charenc.UTF8,

    Binary = charenc.Binary;



C.PBKDF2 = function (password, salt, keylen, options) {



	// Convert to byte arrays

	if (password.constructor == String) password = UTF8.stringToBytes(password);

	if (salt.constructor == String) salt = UTF8.stringToBytes(salt);

	/* else, assume byte arrays already */



	// Defaults

	var hasher = options && options.hasher || C.SHA1,

	    iterations = options && options.iterations || 1;



	// Pseudo-random function

	function PRF(password, salt) {

		return C.HMAC(hasher, salt, password, { asBytes: true });

	}



	// Generate key

	var derivedKeyBytes = [],

	    blockindex = 1;

	while (derivedKeyBytes.length < keylen) {

		var block = PRF(password, salt.concat(util.wordsToBytes([blockindex])));

		for (var u = block, i = 1; i < iterations; i++) {

			u = PRF(password, u);

			for (var j = 0; j < block.length; j++) block[j] ^= u[j];

		}

		derivedKeyBytes = derivedKeyBytes.concat(block);

		blockindex++;

	}



	// Truncate excess bytes

	derivedKeyBytes.length = keylen;



	return options && options.asBytes ? derivedKeyBytes :

	       options && options.asString ? Binary.bytesToString(derivedKeyBytes) :

	       util.bytesToHex(derivedKeyBytes);



};



})();

(function(){



// Shortcuts

var C = Crypto,

    util = C.util,

    charenc = C.charenc,

    UTF8 = charenc.UTF8,

    Binary = charenc.Binary;



C.HMAC = function (hasher, message, key, options) {



	// Convert to byte arrays

	if (message.constructor == String) message = UTF8.stringToBytes(message);

	if (key.constructor == String) key = UTF8.stringToBytes(key);

	/* else, assume byte arrays already */



	// Allow arbitrary length keys

	if (key.length > hasher._blocksize * 4)

		key = hasher(key, { asBytes: true });



	// XOR keys with pad constants

	var okey = key.slice(0),

	    ikey = key.slice(0);

	for (var i = 0; i < hasher._blocksize * 4; i++) {

		okey[i] ^= 0x5C;

		ikey[i] ^= 0x36;

	}



	var hmacbytes = hasher(okey.concat(hasher(ikey.concat(message), { asBytes: true })), { asBytes: true });



	return options && options.asBytes ? hmacbytes :

	       options && options.asString ? Binary.bytesToString(hmacbytes) :

	       util.bytesToHex(hmacbytes);



};



})();

(function() {/*
 A JavaScript implementation of the SHA family of hashes, as defined in FIPS
 PUB 180-2 as well as the corresponding HMAC implementation as defined in
 FIPS PUB 198a

 Copyright Brian Turek 2008-2012
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnson
*/
function n(a){throw a;}var q=null;function s(a,b){this.a=a;this.b=b}function u(a,b){var d=[],h=(1<<b)-1,f=a.length*b,g;for(g=0;g<f;g+=b)d[g>>>5]|=(a.charCodeAt(g/b)&h)<<32-b-g%32;return{value:d,binLen:f}}function x(a){var b=[],d=a.length,h,f;0!==d%2&&n("String of HEX type must be in byte increments");for(h=0;h<d;h+=2)f=parseInt(a.substr(h,2),16),isNaN(f)&&n("String of HEX type contains invalid characters"),b[h>>>3]|=f<<24-4*(h%8);return{value:b,binLen:4*d}}
function B(a){var b=[],d=0,h,f,g,k,m;-1===a.search(/^[a-zA-Z0-9=+\/]+$/)&&n("Invalid character in base-64 string");h=a.indexOf("=");a=a.replace(/\=/g,"");-1!==h&&h<a.length&&n("Invalid '=' found in base-64 string");for(f=0;f<a.length;f+=4){m=a.substr(f,4);for(g=k=0;g<m.length;g+=1)h="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(m[g]),k|=h<<18-6*g;for(g=0;g<m.length-1;g+=1)b[d>>2]|=(k>>>16-8*g&255)<<24-8*(d%4),d+=1}return{value:b,binLen:8*d}}
function E(a,b){var d="",h=4*a.length,f,g;for(f=0;f<h;f+=1)g=a[f>>>2]>>>8*(3-f%4),d+="0123456789abcdef".charAt(g>>>4&15)+"0123456789abcdef".charAt(g&15);return b.outputUpper?d.toUpperCase():d}
function F(a,b){var d="",h=4*a.length,f,g,k;for(f=0;f<h;f+=3){k=(a[f>>>2]>>>8*(3-f%4)&255)<<16|(a[f+1>>>2]>>>8*(3-(f+1)%4)&255)<<8|a[f+2>>>2]>>>8*(3-(f+2)%4)&255;for(g=0;4>g;g+=1)d=8*f+6*g<=32*a.length?d+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(k>>>6*(3-g)&63):d+b.b64Pad}return d}
function G(a){var b={outputUpper:!1,b64Pad:"="};try{a.hasOwnProperty("outputUpper")&&(b.outputUpper=a.outputUpper),a.hasOwnProperty("b64Pad")&&(b.b64Pad=a.b64Pad)}catch(d){}"boolean"!==typeof b.outputUpper&&n("Invalid outputUpper formatting option");"string"!==typeof b.b64Pad&&n("Invalid b64Pad formatting option");return b}
function H(a,b){var d=q,d=new s(a.a,a.b);return d=32>=b?new s(d.a>>>b|d.b<<32-b&4294967295,d.b>>>b|d.a<<32-b&4294967295):new s(d.b>>>b-32|d.a<<64-b&4294967295,d.a>>>b-32|d.b<<64-b&4294967295)}function I(a,b){var d=q;return d=32>=b?new s(a.a>>>b,a.b>>>b|a.a<<32-b&4294967295):new s(0,a.a>>>b-32)}function J(a,b,d){return new s(a.a&b.a^~a.a&d.a,a.b&b.b^~a.b&d.b)}function U(a,b,d){return new s(a.a&b.a^a.a&d.a^b.a&d.a,a.b&b.b^a.b&d.b^b.b&d.b)}
function V(a){var b=H(a,28),d=H(a,34);a=H(a,39);return new s(b.a^d.a^a.a,b.b^d.b^a.b)}function W(a){var b=H(a,14),d=H(a,18);a=H(a,41);return new s(b.a^d.a^a.a,b.b^d.b^a.b)}function X(a){var b=H(a,1),d=H(a,8);a=I(a,7);return new s(b.a^d.a^a.a,b.b^d.b^a.b)}function Y(a){var b=H(a,19),d=H(a,61);a=I(a,6);return new s(b.a^d.a^a.a,b.b^d.b^a.b)}
function Z(a,b){var d,h,f;d=(a.b&65535)+(b.b&65535);h=(a.b>>>16)+(b.b>>>16)+(d>>>16);f=(h&65535)<<16|d&65535;d=(a.a&65535)+(b.a&65535)+(h>>>16);h=(a.a>>>16)+(b.a>>>16)+(d>>>16);return new s((h&65535)<<16|d&65535,f)}
function aa(a,b,d,h){var f,g,k;f=(a.b&65535)+(b.b&65535)+(d.b&65535)+(h.b&65535);g=(a.b>>>16)+(b.b>>>16)+(d.b>>>16)+(h.b>>>16)+(f>>>16);k=(g&65535)<<16|f&65535;f=(a.a&65535)+(b.a&65535)+(d.a&65535)+(h.a&65535)+(g>>>16);g=(a.a>>>16)+(b.a>>>16)+(d.a>>>16)+(h.a>>>16)+(f>>>16);return new s((g&65535)<<16|f&65535,k)}
function ba(a,b,d,h,f){var g,k,m;g=(a.b&65535)+(b.b&65535)+(d.b&65535)+(h.b&65535)+(f.b&65535);k=(a.b>>>16)+(b.b>>>16)+(d.b>>>16)+(h.b>>>16)+(f.b>>>16)+(g>>>16);m=(k&65535)<<16|g&65535;g=(a.a&65535)+(b.a&65535)+(d.a&65535)+(h.a&65535)+(f.a&65535)+(k>>>16);k=(a.a>>>16)+(b.a>>>16)+(d.a>>>16)+(h.a>>>16)+(f.a>>>16)+(g>>>16);return new s((k&65535)<<16|g&65535,m)}
function $(a,b,d){var h,f,g,k,m,j,A,C,K,e,L,v,l,M,t,p,y,z,r,N,O,P,Q,R,c,S,w=[],T,D;"SHA-384"===d||"SHA-512"===d?(L=80,h=(b+128>>>10<<5)+31,M=32,t=2,c=s,p=Z,y=aa,z=ba,r=X,N=Y,O=V,P=W,R=U,Q=J,S=[new c(1116352408,3609767458),new c(1899447441,602891725),new c(3049323471,3964484399),new c(3921009573,2173295548),new c(961987163,4081628472),new c(1508970993,3053834265),new c(2453635748,2937671579),new c(2870763221,3664609560),new c(3624381080,2734883394),new c(310598401,1164996542),new c(607225278,1323610764),
new c(1426881987,3590304994),new c(1925078388,4068182383),new c(2162078206,991336113),new c(2614888103,633803317),new c(3248222580,3479774868),new c(3835390401,2666613458),new c(4022224774,944711139),new c(264347078,2341262773),new c(604807628,2007800933),new c(770255983,1495990901),new c(1249150122,1856431235),new c(1555081692,3175218132),new c(1996064986,2198950837),new c(2554220882,3999719339),new c(2821834349,766784016),new c(2952996808,2566594879),new c(3210313671,3203337956),new c(3336571891,
1034457026),new c(3584528711,2466948901),new c(113926993,3758326383),new c(338241895,168717936),new c(666307205,1188179964),new c(773529912,1546045734),new c(1294757372,1522805485),new c(1396182291,2643833823),new c(1695183700,2343527390),new c(1986661051,1014477480),new c(2177026350,1206759142),new c(2456956037,344077627),new c(2730485921,1290863460),new c(2820302411,3158454273),new c(3259730800,3505952657),new c(3345764771,106217008),new c(3516065817,3606008344),new c(3600352804,1432725776),new c(4094571909,
1467031594),new c(275423344,851169720),new c(430227734,3100823752),new c(506948616,1363258195),new c(659060556,3750685593),new c(883997877,3785050280),new c(958139571,3318307427),new c(1322822218,3812723403),new c(1537002063,2003034995),new c(1747873779,3602036899),new c(1955562222,1575990012),new c(2024104815,1125592928),new c(2227730452,2716904306),new c(2361852424,442776044),new c(2428436474,593698344),new c(2756734187,3733110249),new c(3204031479,2999351573),new c(3329325298,3815920427),new c(3391569614,
3928383900),new c(3515267271,566280711),new c(3940187606,3454069534),new c(4118630271,4000239992),new c(116418474,1914138554),new c(174292421,2731055270),new c(289380356,3203993006),new c(460393269,320620315),new c(685471733,587496836),new c(852142971,1086792851),new c(1017036298,365543100),new c(1126000580,2618297676),new c(1288033470,3409855158),new c(1501505948,4234509866),new c(1607167915,987167468),new c(1816402316,1246189591)],e="SHA-384"===d?[new c(3418070365,3238371032),new c(1654270250,914150663),
new c(2438529370,812702999),new c(355462360,4144912697),new c(1731405415,4290775857),new c(41048885895,1750603025),new c(3675008525,1694076839),new c(1203062813,3204075428)]:[new c(1779033703,4089235720),new c(3144134277,2227873595),new c(1013904242,4271175723),new c(2773480762,1595750129),new c(1359893119,2917565137),new c(2600822924,725511199),new c(528734635,4215389547),new c(1541459225,327033209)]):n("Unexpected error in SHA-2 implementation");a[b>>>5]|=128<<24-b%32;a[h]=b;T=a.length;for(v=0;v<
T;v+=M){b=e[0];h=e[1];f=e[2];g=e[3];k=e[4];m=e[5];j=e[6];A=e[7];for(l=0;l<L;l+=1)w[l]=16>l?new c(a[l*t+v],a[l*t+v+1]):y(N(w[l-2]),w[l-7],r(w[l-15]),w[l-16]),C=z(A,P(k),Q(k,m,j),S[l],w[l]),K=p(O(b),R(b,h,f)),A=j,j=m,m=k,k=p(g,C),g=f,f=h,h=b,b=p(C,K);e[0]=p(b,e[0]);e[1]=p(h,e[1]);e[2]=p(f,e[2]);e[3]=p(g,e[3]);e[4]=p(k,e[4]);e[5]=p(m,e[5]);e[6]=p(j,e[6]);e[7]=p(A,e[7])}"SHA-384"===d?D=[e[0].a,e[0].b,e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,e[4].b,e[5].a,e[5].b]:"SHA-512"===d?D=[e[0].a,e[0].b,
e[1].a,e[1].b,e[2].a,e[2].b,e[3].a,e[3].b,e[4].a,e[4].b,e[5].a,e[5].b,e[6].a,e[6].b,e[7].a,e[7].b]:n("Unexpected error in SHA-2 implementation");return D}
window.jsSHA=function(a,b,d){var h=q,f=q,g=0,k=[0],m=0,j=q,m="undefined"!==typeof d?d:8;8===m||16===m||n("charSize must be 8 or 16");"HEX"===b?(0!==a.length%2&&n("srcString of HEX type must be in byte increments"),j=x(a),g=j.binLen,k=j.value):"ASCII"===b||"TEXT"===b?(j=u(a,m),g=j.binLen,k=j.value):"B64"===b?(j=B(a),g=j.binLen,k=j.value):n("inputFormat must be HEX, TEXT, ASCII, or B64");this.getHash=function(a,b,d){var e=q,m=k.slice(),j="";switch(b){case "HEX":e=E;break;case "B64":e=F;break;default:n("format must be HEX or B64")}"SHA-384"===
a?(q===h&&(h=$(m,g,a)),j=e(h,G(d))):"SHA-512"===a?(q===f&&(f=$(m,g,a)),j=e(f,G(d))):n("Chosen SHA variant is not supported");return j};this.getHMAC=function(a,b,d,e,f){var h,l,j,t,p,y=[],z=[],r=q;switch(e){case "HEX":h=E;break;case "B64":h=F;break;default:n("outputFormat must be HEX or B64")}"SHA-384"===d?(j=128,p=384):"SHA-512"===d?(j=128,p=512):n("Chosen SHA variant is not supported");"HEX"===b?(r=x(a),t=r.binLen,l=r.value):"ASCII"===b||"TEXT"===b?(r=u(a,m),t=r.binLen,l=r.value):"B64"===b?(r=B(a),
t=r.binLen,l=r.value):n("inputFormat must be HEX, TEXT, ASCII, or B64");a=8*j;b=j/4-1;j<t/8?(l=$(l,t,d),l[b]&=4294967040):j>t/8&&(l[b]&=4294967040);for(j=0;j<=b;j+=1)y[j]=l[j]^909522486,z[j]=l[j]^1549556828;d=$(z.concat($(y.concat(k),a+g,d)),a+p,d);return h(d,G(f))}};})();
/*!
 * Crypto-JS v2.0.0
 * http://code.google.com/p/crypto-js/
 * Copyright (c) 2009, Jeff Mott. All rights reserved.
 * http://code.google.com/p/crypto-js/wiki/License
 *
 * A JavaScript implementation of the RIPEMD-160 Algorithm
 * Version 2.2 Copyright Jeremy Lin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 * Also http://www.ocf.berkeley.edu/~jjlin/jsotp/
 * Ported to Crypto-JS by Stefan Thomas.
 */

(function () {
        // Shortcuts
        var C = Crypto,
    util = C.util,
    charenc = C.charenc,
    UTF8 = charenc.UTF8,
    Binary = charenc.Binary;

        // Convert a byte array to little-endian 32-bit words
        util.bytesToLWords = function (bytes) {

                var output = Array(bytes.length >> 2);
                for (var i = 0; i < output.length; i++)
                        output[i] = 0;
                for (var i = 0; i < bytes.length * 8; i += 8)
                        output[i>>5] |= (bytes[i / 8] & 0xFF) << (i%32);
                return output;
        };

        // Convert little-endian 32-bit words to a byte array
        util.lWordsToBytes = function (words) {
                var output = [];
                for (var i = 0; i < words.length * 32; i += 8)
                        output.push((words[i>>5] >>> (i % 32)) & 0xff);
                return output;
        };

        // Public API
        var RIPEMD160 = C.RIPEMD160 = function (message, options) {
                var digestbytes = util.lWordsToBytes(RIPEMD160._rmd160(message));
                return options && options.asBytes ? digestbytes :
                        options && options.asString ? Binary.bytesToString(digestbytes) :
                        util.bytesToHex(digestbytes);
        };

        // The core
        RIPEMD160._rmd160 = function (message)
        {
                // Convert to byte array
                if (message.constructor == String) message = UTF8.stringToBytes(message);

                var x = util.bytesToLWords(message),
                    len = message.length * 8;

                /* append padding */
                x[len >> 5] |= 0x80 << (len % 32);
                x[(((len + 64) >>> 9) << 4) + 14] = len;

                var h0 = 0x67452301;
                var h1 = 0xefcdab89;
                var h2 = 0x98badcfe;
                var h3 = 0x10325476;
                var h4 = 0xc3d2e1f0;

                for (var i = 0; i < x.length; i += 16) {
                        var T;
                        var A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
                        var A2 = h0, B2 = h1, C2 = h2, D2 = h3, E2 = h4;
                        for (var j = 0; j <= 79; ++j) {
                                T = safe_add(A1, rmd160_f(j, B1, C1, D1));
                                T = safe_add(T, x[i + rmd160_r1[j]]);
                                T = safe_add(T, rmd160_K1(j));
                                T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
                                A1 = E1; E1 = D1; D1 = bit_rol(C1, 10); C1 = B1; B1 = T;
                                T = safe_add(A2, rmd160_f(79-j, B2, C2, D2));
                                T = safe_add(T, x[i + rmd160_r2[j]]);
                                T = safe_add(T, rmd160_K2(j));
                                T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
                                A2 = E2; E2 = D2; D2 = bit_rol(C2, 10); C2 = B2; B2 = T;
                        }
                        T = safe_add(h1, safe_add(C1, D2));
                        h1 = safe_add(h2, safe_add(D1, E2));
                        h2 = safe_add(h3, safe_add(E1, A2));
                        h3 = safe_add(h4, safe_add(A1, B2));
                        h4 = safe_add(h0, safe_add(B1, C2));
                        h0 = T;
                }
                return [h0, h1, h2, h3, h4];
        }

        function rmd160_f(j, x, y, z)
        {
                return ( 0 <= j && j <= 15) ? (x ^ y ^ z) :
                        (16 <= j && j <= 31) ? (x & y) | (~x & z) :
                        (32 <= j && j <= 47) ? (x | ~y) ^ z :
                        (48 <= j && j <= 63) ? (x & z) | (y & ~z) :
                        (64 <= j && j <= 79) ? x ^ (y | ~z) :
                        "rmd160_f: j out of range";
        }
        function rmd160_K1(j)
        {
                return ( 0 <= j && j <= 15) ? 0x00000000 :
                        (16 <= j && j <= 31) ? 0x5a827999 :
                        (32 <= j && j <= 47) ? 0x6ed9eba1 :
                        (48 <= j && j <= 63) ? 0x8f1bbcdc :
                        (64 <= j && j <= 79) ? 0xa953fd4e :
                        "rmd160_K1: j out of range";
        }
        function rmd160_K2(j)
        {
                return ( 0 <= j && j <= 15) ? 0x50a28be6 :
                        (16 <= j && j <= 31) ? 0x5c4dd124 :
                        (32 <= j && j <= 47) ? 0x6d703ef3 :
                        (48 <= j && j <= 63) ? 0x7a6d76e9 :
                        (64 <= j && j <= 79) ? 0x00000000 :
                        "rmd160_K2: j out of range";
        }
        var rmd160_r1 = [
                0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
                7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
                3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
                1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
                4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13
        ];
        var rmd160_r2 = [
                5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
                6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
                15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
                8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
                12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11
        ];
        var rmd160_s1 = [
                11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
                7,  6,  8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
                11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
                11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
                9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6
        ];
        var rmd160_s2 = [
                8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
                9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
                9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
                15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
                8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11
        ];

        /*
         * Add integers, wrapping at 2^32. This uses 16-bit operations internally
         * to work around bugs in some JS interpreters.
         */
        function safe_add(x, y)
        {
                var lsw = (x & 0xFFFF) + (y & 0xFFFF);
                var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return (msw << 16) | (lsw & 0xFFFF);
        }

        /*
         * Bitwise rotate a 32-bit number to the left.
         */
        function bit_rol(num, cnt)
        {
                return (num << cnt) | (num >>> (32 - cnt));
        }
})();
/*
 * Copyright (c) 2010-2011 Intalio Pte, All Rights Reserved
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var MAX_VALUE = 2147483647;

//function scrypt(byte[] passwd, byte[] salt, int N, int r, int p, int dkLen)
/*
 * N = Cpu cost
 * r = Memory cost
 * p = parallelization cost
 *
 */
Bitcoin.scrypt = function(passwd, salt, N, r, p, dkLen) {
    if (N == 0 || (N & (N - 1)) != 0) throw Error("N must be > 0 and a power of 2");

    if (N > MAX_VALUE / 128 / r) throw Error("Parameter N is too large");
    if (r > MAX_VALUE / 128 / p) throw Error("Parameter r is too large");

    var PBKDF2_opts = {iterations: 1, hasher: Crypto.SHA256, asBytes: true};

    var DK = []; //new Array(dkLen);

    var B  = []; //new Array(128 * r * p);
    var XY = []; //new Array(256 * r);
    var V  = []; //new Array(128 * r * N);
    var i;

    var B = Crypto.PBKDF2(passwd, salt, p * 128 * r, PBKDF2_opts);

    for(i = 0; i < p; i++) {
        smix(B, i * 128 * r, r, N, V, XY);
    }

    DK = Crypto.PBKDF2(passwd, B, dkLen, PBKDF2_opts)
    return DK;
}

function smix(B, Bi, r, N, V, XY) {
    var Xi = 0;
    var Yi = 128 * r;
    var i;

    arraycopy32(B, Bi, XY, Xi, Yi);

    for (i = 0; i < N; i++) {
    	arraycopy32(XY, Xi, V, i * Yi, Yi);
        blockmix_salsa8(XY, Xi, Yi, r);
    }

    for (i = 0; i < N; i++) {
        var j = integerify(XY, Xi, r) & (N - 1);
        blockxor(V, j * Yi, XY, Xi, Yi);
        blockmix_salsa8(XY, Xi, Yi, r);
    }

    arraycopy32(XY, Xi, B, Bi, Yi);
}

function blockmix_salsa8(BY, Bi, Yi, r) {
    var X = [];
    var i;

    arraycopy32(BY, Bi + (2 * r - 1) * 64, X, 0, 64);

    for (i = 0; i < 2 * r; i++) {
        blockxor(BY, i * 64, X, 0, 64);
        salsa20_8(X);
        arraycopy32(X, 0, BY, Yi + (i * 64), 64);
    }

    for (i = 0; i < r; i++) {
    	arraycopy32(BY, Yi + (i * 2) * 64, BY, Bi + (i * 64), 64);
    }

    for (i = 0; i < r; i++) {
    	arraycopy32(BY, Yi + (i * 2 + 1) * 64, BY, Bi + (i + r) * 64, 64);
    }
}

function R(a, b) {
    return (a << b) | (a >>> (32 - b));
}

function salsa20_8(B) {
    var B32 = new Array(32);
    var x   = new Array(32);
    var i;

    for (i = 0; i < 16; i++) {
        B32[i]  = (B[i * 4 + 0] & 0xff) << 0;
        B32[i] |= (B[i * 4 + 1] & 0xff) << 8;
        B32[i] |= (B[i * 4 + 2] & 0xff) << 16;
        B32[i] |= (B[i * 4 + 3] & 0xff) << 24;
    }

    arraycopy(B32, 0, x, 0, 16);

    for (i = 8; i > 0; i -= 2) {
        x[ 4] ^= R(x[ 0]+x[12], 7);  x[ 8] ^= R(x[ 4]+x[ 0], 9);
        x[12] ^= R(x[ 8]+x[ 4],13);  x[ 0] ^= R(x[12]+x[ 8],18);
        x[ 9] ^= R(x[ 5]+x[ 1], 7);  x[13] ^= R(x[ 9]+x[ 5], 9);
        x[ 1] ^= R(x[13]+x[ 9],13);  x[ 5] ^= R(x[ 1]+x[13],18);
        x[14] ^= R(x[10]+x[ 6], 7);  x[ 2] ^= R(x[14]+x[10], 9);
        x[ 6] ^= R(x[ 2]+x[14],13);  x[10] ^= R(x[ 6]+x[ 2],18);
        x[ 3] ^= R(x[15]+x[11], 7);  x[ 7] ^= R(x[ 3]+x[15], 9);
        x[11] ^= R(x[ 7]+x[ 3],13);  x[15] ^= R(x[11]+x[ 7],18);
        x[ 1] ^= R(x[ 0]+x[ 3], 7);  x[ 2] ^= R(x[ 1]+x[ 0], 9);
        x[ 3] ^= R(x[ 2]+x[ 1],13);  x[ 0] ^= R(x[ 3]+x[ 2],18);
        x[ 6] ^= R(x[ 5]+x[ 4], 7);  x[ 7] ^= R(x[ 6]+x[ 5], 9);
        x[ 4] ^= R(x[ 7]+x[ 6],13);  x[ 5] ^= R(x[ 4]+x[ 7],18);
        x[11] ^= R(x[10]+x[ 9], 7);  x[ 8] ^= R(x[11]+x[10], 9);
        x[ 9] ^= R(x[ 8]+x[11],13);  x[10] ^= R(x[ 9]+x[ 8],18);
        x[12] ^= R(x[15]+x[14], 7);  x[13] ^= R(x[12]+x[15], 9);
        x[14] ^= R(x[13]+x[12],13);  x[15] ^= R(x[14]+x[13],18);
    }

    for (i = 0; i < 16; ++i) B32[i] = x[i] + B32[i];

    for (i = 0; i < 16; i++) {
    	var bi = i * 4;
        B[bi + 0] = (B32[i] >> 0  & 0xff);
        B[bi + 1] = (B32[i] >> 8  & 0xff);
        B[bi + 2] = (B32[i] >> 16 & 0xff);
        B[bi + 3] = (B32[i] >> 24 & 0xff);
    }
}

function blockxor(S, Si, D, Di, len) {
	var i = len>>6;
	while (i--) {
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		//32

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];

		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		D[Di++] ^= S[Si++]; D[Di++] ^= S[Si++];
		// 64

	}
}

function integerify(B, bi, r) {
    var n;

    bi += (2 * r - 1) * 64;

    n  = (B[bi + 0] & 0xff) << 0;
    n |= (B[bi + 1] & 0xff) << 8;
    n |= (B[bi + 2] & 0xff) << 16;
    n |= (B[bi + 3] & 0xff) << 24;

    return n;
}

function arraycopy(src, srcPos, dest, destPos, length) {
	 while (length-- ){
		 dest[destPos++] = src[srcPos++];
	 }
}

function arraycopy16(src, srcPos, dest, destPos, length) {
	var i = length>>4;
	while(i--) {
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
	}
}

function arraycopy32(src, srcPos, dest, destPos, length) {
	var i = length>>5;
	while(i--) {
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];

		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		dest[destPos++] = src[srcPos++]; dest[destPos++] = src[srcPos++];
		// 32
	}
}

// Use SJCL for our random source

function SecureRandom() {
}

SecureRandom.prototype.clientSideRandomInit = function() {
  sjcl.random.startCollectors();  // do this only once
}

SecureRandom.prototype.nextBytes = function(arrayToFillRandomly) {
  var length = arrayToFillRandomly.length
  var randomArray = sjcl.random.randomWords(length);
  for (var index = 0; index < length; ++index) {
    if (randomArray[index] < 0) {
      randomArray[index] = -randomArray[index];
    }
    arrayToFillRandomly[index] = randomArray[index] % 256;
  }
}
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+this.DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Extended JavaScript BN functions, required for RSA private ops.

// Version 1.1: new BigInteger("0", 10) returns "proper" zero
// Version 1.2: square() API, isProbablePrime fix

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  this.fromInt(0);
  if(b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    this.dMultiply(Math.pow(b,j));
    this.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) this.fromInt(1);
    else {
      this.fromNumber(a,c);
      if(!this.testBit(a-1))	// force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
      if(this.isEven()) this.dAddOffset(1,0); // force odd
      while(!this.isProbablePrime(b)) {
        this.dAddOffset(2,0);
        if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = new Array(), t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    this.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var i = this.t, r = new Array();
  r[0] = this.s;
  var p = this.DB-(i*this.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
      r[k++] = d|(this.s<<(this.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (this[i]&((1<<p)-1))<<(8-p);
        d |= this[--i]>>(p+=this.DB-8);
      }
      else {
        d = (this[i]>>(p-=8))&0xff;
        if(p <= 0) { p += this.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var i, f, m = Math.min(a.t,this.t);
  for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
  if(a.t < this.t) {
    f = a.s&this.DM;
    for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
    r.t = this.t;
  }
  else {
    f = this.s&this.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(this.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]+a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c += a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = this.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  x.drShiftTo(this.m.t-1,this.r2);
  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
  x.subTo(this.r2,x);
  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e[j]>>(i-k1))&km;
    else {
      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += this.DB; --j; }
    if(is1) {	// ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = this.DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs();
  if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
    for(i = 0; i < lowprimes.length; ++i)
      if(x[0] == lowprimes[i]) return true;
    return false;
  }
  if(x.isEven()) return false;
  i = 1;
  while(i < lowprimes.length) {
    var m = lowprimes[i], j = i+1;
    while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while(i < j) if(m%lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if(k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t+1)>>1;
  if(t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for(var i = 0; i < t; ++i) {
    //Pick bases at random, instead of starting at 2
    a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
    var y = a.modPow(r,this);
    if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1;
      while(j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2,this);
        if(y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if(y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// JSBN-specific extension
BigInteger.prototype.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)
// Basic Javascript Elliptic Curve implementation
// Ported loosely from BouncyCastle's Java EC code
// Only Fp curves implemented for now

// Requires jsbn.js and jsbn2.js

// ----------------
// ECFieldElementFp

// constructor
function ECFieldElementFp(q,x) {
    this.x = x;
    // TODO if(x.compareTo(q) >= 0) error
    this.q = q;
}

function feFpEquals(other) {
    if(other == this) return true;
    return (this.q.equals(other.q) && this.x.equals(other.x));
}

function feFpToBigInteger() {
    return this.x;
}

function feFpNegate() {
    return new ECFieldElementFp(this.q, this.x.negate().mod(this.q));
}

function feFpAdd(b) {
    return new ECFieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
}

function feFpSubtract(b) {
    return new ECFieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
}

function feFpMultiply(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
}

function feFpSquare() {
    return new ECFieldElementFp(this.q, this.x.square().mod(this.q));
}

function feFpDivide(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
}

ECFieldElementFp.prototype.equals = feFpEquals;
ECFieldElementFp.prototype.toBigInteger = feFpToBigInteger;
ECFieldElementFp.prototype.negate = feFpNegate;
ECFieldElementFp.prototype.add = feFpAdd;
ECFieldElementFp.prototype.subtract = feFpSubtract;
ECFieldElementFp.prototype.multiply = feFpMultiply;
ECFieldElementFp.prototype.square = feFpSquare;
ECFieldElementFp.prototype.divide = feFpDivide;

// ----------------
// ECPointFp

// constructor
function ECPointFp(curve,x,y,z) {
    this.curve = curve;
    this.x = x;
    this.y = y;
    // Projective coordinates: either zinv == null or z * zinv == 1
    // z and zinv are just BigIntegers, not fieldElements
    if(z == null) {
      this.z = BigInteger.ONE;
    }
    else {
      this.z = z;
    }
    this.zinv = null;
    //TODO: compression flag
}

function pointFpGetX() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpGetY() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpEquals(other) {
    if(other == this) return true;
    if(this.isInfinity()) return other.isInfinity();
    if(other.isInfinity()) return this.isInfinity();
    var u, v;
    // u = Y2 * Z1 - Y1 * Z2
    u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
    if(!u.equals(BigInteger.ZERO)) return false;
    // v = X2 * Z1 - X1 * Z2
    v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
    return v.equals(BigInteger.ZERO);
}

function pointFpIsInfinity() {
    if((this.x == null) && (this.y == null)) return true;
    return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
}

function pointFpNegate() {
    return new ECPointFp(this.curve, this.x, this.y.negate(), this.z);
}

function pointFpAdd(b) {
    if(this.isInfinity()) return b;
    if(b.isInfinity()) return this;

    // u = Y2 * Z1 - Y1 * Z2
    var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
    // v = X2 * Z1 - X1 * Z2
    var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);

    if(BigInteger.ZERO.equals(v)) {
        if(BigInteger.ZERO.equals(u)) {
            return this.twice(); // this == b, so double
        }
	return this.curve.getInfinity(); // this = -b, so infinity
    }

    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();
    var x2 = b.x.toBigInteger();
    var y2 = b.y.toBigInteger();

    var v2 = v.square();
    var v3 = v2.multiply(v);
    var x1v2 = x1.multiply(v2);
    var zu2 = u.square().multiply(this.z);

    // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
    var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
    // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
    var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
    // z3 = v^3 * z1 * z2
    var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

function pointFpTwice() {
    if(this.isInfinity()) return this;
    if(this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

    // TODO: optimized handling of constants
    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();

    var y1z1 = y1.multiply(this.z);
    var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
    var a = this.curve.a.toBigInteger();

    // w = 3 * x1^2 + a * z1^2
    var w = x1.square().multiply(THREE);
    if(!BigInteger.ZERO.equals(a)) {
      w = w.add(this.z.square().multiply(a));
    }
    w = w.mod(this.curve.q);
    // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
    var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
    // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
    var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
    // z3 = 8 * (y1 * z1)^3
    var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
function pointFpMultiply(k) {
    if(this.isInfinity()) return this;
    if(k.signum() == 0) return this.curve.getInfinity();

    var e = k;
    var h = e.multiply(new BigInteger("3"));

    var neg = this.negate();
    var R = this;

    var i;
    for(i = h.bitLength() - 2; i > 0; --i) {
	R = R.twice();

	var hBit = h.testBit(i);
	var eBit = e.testBit(i);

	if (hBit != eBit) {
	    R = R.add(hBit ? this : neg);
	}
    }

    return R;
}

// Compute this*j + x*k (simultaneous multiplication)
function pointFpMultiplyTwo(j,x,k) {
  var i;
  if(j.bitLength() > k.bitLength())
    i = j.bitLength() - 1;
  else
    i = k.bitLength() - 1;

  var R = this.curve.getInfinity();
  var both = this.add(x);
  while(i >= 0) {
    R = R.twice();
    if(j.testBit(i)) {
      if(k.testBit(i)) {
        R = R.add(both);
      }
      else {
        R = R.add(this);
      }
    }
    else {
      if(k.testBit(i)) {
        R = R.add(x);
      }
    }
    --i;
  }

  return R;
}

ECPointFp.prototype.getX = pointFpGetX;
ECPointFp.prototype.getY = pointFpGetY;
ECPointFp.prototype.equals = pointFpEquals;
ECPointFp.prototype.isInfinity = pointFpIsInfinity;
ECPointFp.prototype.negate = pointFpNegate;
ECPointFp.prototype.add = pointFpAdd;
ECPointFp.prototype.twice = pointFpTwice;
ECPointFp.prototype.multiply = pointFpMultiply;
ECPointFp.prototype.multiplyTwo = pointFpMultiplyTwo;

// ----------------
// ECCurveFp

// constructor
function ECCurveFp(q,a,b) {
    this.q = q;
    this.a = this.fromBigInteger(a);
    this.b = this.fromBigInteger(b);
    this.infinity = new ECPointFp(this, null, null);
}

function curveFpGetQ() {
    return this.q;
}

function curveFpGetA() {
    return this.a;
}

function curveFpGetB() {
    return this.b;
}

function curveFpEquals(other) {
    if(other == this) return true;
    return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
}

function curveFpGetInfinity() {
    return this.infinity;
}

function curveFpFromBigInteger(x) {
    return new ECFieldElementFp(this.q, x);
}

function curveFpDecompressPoint(yOdd, X) {
  if(this.q.mod(BigInteger.valueOf(4)).equals(BigInteger.valueOf(3))) {
    // y^2 = x^3 + ax^2 + b, so we need to perform sqrt to recover y
    var ySquared = X.multiply(X.square().add(this.a)).add(this.b);

    // sqrt(a) = a^((q-1)/4) if q = 3 mod 4
    var Y = ySquared.x.modPow(this.q.add(BigInteger.ONE).divide(BigInteger.valueOf(4)), this.q);

    if(Y.testBit(0) !== yOdd) {
      Y = this.q.subtract(Y);
    }

    return new ECPointFp(this, X, this.fromBigInteger(Y));
  } else {
    throw new Error("point decompression only implements sqrt for q = 3 mod 4");
  }
};

// for now, work with hex strings because they're easier in JS
function curveFpDecodePointHex(s) {
    switch(parseInt(s.substr(0,2), 16)) { // first byte
    case 0:
	return this.infinity;
    case 2:
        return this.decompressPoint(false, this.fromBigInteger(new BigInteger(s.substr(2), 16)));
    case 3:
        return this.decompressPoint(true, this.fromBigInteger(new BigInteger(s.substr(2), 16)));
    case 4:
    case 6:
    case 7:
	var len = (s.length - 2) / 2;
	var xHex = s.substr(2, len);
	var yHex = s.substr(len+2, len);

	return new ECPointFp(this,
			     this.fromBigInteger(new BigInteger(xHex, 16)),
			     this.fromBigInteger(new BigInteger(yHex, 16)));

    default: // unsupported
	return null;
    }
}

ECCurveFp.prototype.getQ = curveFpGetQ;
ECCurveFp.prototype.getA = curveFpGetA;
ECCurveFp.prototype.getB = curveFpGetB;
ECCurveFp.prototype.equals = curveFpEquals;
ECCurveFp.prototype.getInfinity = curveFpGetInfinity;
ECCurveFp.prototype.fromBigInteger = curveFpFromBigInteger;
ECCurveFp.prototype.decodePointHex = curveFpDecodePointHex;
ECCurveFp.prototype.decompressPoint = curveFpDecompressPoint;
// Named EC curves

// Requires ec.js, jsbn.js, and jsbn2.js

// ----------------
// X9ECParameters

// constructor
function X9ECParameters(curve,g,n,h) {
    this.curve = curve;
    this.g = g;
    this.n = n;
    this.h = h;
}

function x9getCurve() {
    return this.curve;
}

function x9getG() {
    return this.g;
}

function x9getN() {
    return this.n;
}

function x9getH() {
    return this.h;
}

X9ECParameters.prototype.getCurve = x9getCurve;
X9ECParameters.prototype.getG = x9getG;
X9ECParameters.prototype.getN = x9getN;
X9ECParameters.prototype.getH = x9getH;

// ----------------
// SECNamedCurves

function fromHex(s) { return new BigInteger(s, 16); }

function secp128r1() {
    // p = 2^128 - 2^97 - 1
    var p = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("E87579C11079F43DD824993C2CEE5ED3");
    //byte[] S = Hex.decode("000E0D4D696E6768756151750CC03A4473D03679");
    var n = fromHex("FFFFFFFE0000000075A30D1B9038A115");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "161FF7528B899B2D0C28607CA52C5B86"
		+ "CF5AC8395BAFEB13C02DA292DDED7A83");
    return new X9ECParameters(curve, G, n, h);
}

function secp160k1() {
    // p = 2^160 - 2^32 - 2^14 - 2^12 - 2^9 - 2^8 - 2^7 - 2^3 - 2^2 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("0100000000000000000001B8FA16DFAB9ACA16B6B3");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "3B4C382CE37AA192A4019E763036F4F5DD4D7EBB"
                + "938CF935318FDCED6BC28286531733C3F03C4FEE");
    return new X9ECParameters(curve, G, n, h);
}

function secp160r1() {
    // p = 2^160 - 2^31 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC");
    var b = fromHex("1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45");
    //byte[] S = Hex.decode("1053CDE42C14D696E67687561517533BF3F83345");
    var n = fromHex("0100000000000000000001F4C8F927AED3CA752257");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
		+ "4A96B5688EF573284664698968C38BB913CBFC82"
		+ "23A628553168947D59DCC912042351377AC5FB32");
    return new X9ECParameters(curve, G, n, h);
}

function secp192k1() {
    // p = 2^192 - 2^32 - 2^12 - 2^8 - 2^7 - 2^6 - 2^3 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37");
    var a = BigInteger.ZERO;
    var b = fromHex("3");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D"
                + "9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D");
    return new X9ECParameters(curve, G, n, h);
}

function secp192r1() {
    // p = 2^192 - 2^64 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC");
    var b = fromHex("64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1");
    //byte[] S = Hex.decode("3045AE6FC8422F64ED579528D38120EAE12196D5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012"
                + "07192B95FFC8DA78631011ED6B24CDD573F977A11E794811");
    return new X9ECParameters(curve, G, n, h);
}

function secp224r1() {
    // p = 2^224 - 2^96 + 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001");
    var a = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE");
    var b = fromHex("B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4");
    //byte[] S = Hex.decode("BD71344799D5C7FCDC45B59FA3B9AB8F6A948BC5");
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21"
                + "BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34");
    return new X9ECParameters(curve, G, n, h);
}

function secp256k1() {
    // p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
    var p = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
    var a = BigInteger.ZERO;
    var b = fromHex("7");
    //byte[] S = null;
    var n = fromHex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"
	            + "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");
    return new X9ECParameters(curve, G, n, h);
}

function secp256r1() {
    // p = 2^224 (2^32 - 1) + 2^192 + 2^96 - 1
    var p = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF");
    var a = fromHex("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC");
    var b = fromHex("5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B");
    //byte[] S = Hex.decode("C49D360886E704936A6678E1139D26B7819F7E90");
    var n = fromHex("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
    var h = BigInteger.ONE;
    var curve = new ECCurveFp(p, a, b);
    var G = curve.decodePointHex("04"
                + "6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296"
		+ "4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5");
    return new X9ECParameters(curve, G, n, h);
}

// TODO: make this into a proper hashtable
function getSECCurveByName(name) {
    if(name == "secp128r1") return secp128r1();
    if(name == "secp160k1") return secp160k1();
    if(name == "secp160r1") return secp160r1();
    if(name == "secp192k1") return secp192k1();
    if(name == "secp192r1") return secp192r1();
    if(name == "secp224r1") return secp224r1();
    if(name == "secp256k1") return secp256k1();
    if(name == "secp256r1") return secp256r1();
    return null;
}
/**
 * EventEmitter Mixin
 *
 * Designed to be used in conjunction with a mixin "augment" function,
 * such as http://chamnapchhorn.blogspot.com/2009/05/javascript-mixins.html
 *
 * @usage augment(MyClass, EventEmitter);
 * my_inst = new MyClass();
 * my_inst.on('someEvent', function(e){ console.dir(e); });
 * my_inst.trigger('someEvent', {eventProp:'value'});
 * 
 * @example
 * // create a 'class'
 * MyClass = function() {}
 * // augment it with EventEmitter
 * EventEmitter.augment(MyClass.prototype);
 * // create a method, which triggers an event
 * MyClass.prototype.scrollComplete = function() {
 *     this.trigger('scrolled', {baz:'eck'});
 * };
 * 
 * // this callback is pulled out into a named function so that we can unbind it
 * var callback = function(e) {
 *     console.log('the scrolled event was fired! this.foo='+this.foo+', e.baz='+e.baz);
 * };
 * // create an instance of th class
 * var myinstance = new MyClass();
 * // set a property on the instance
 * myinstance.foo = 'bar';
 * // bind to the scrollComplete event
 * myinstance.on('scrolled', callback, myinstance);
 * // fire the method, which should trigger the event and therefore our callback
 * myinstance.scrollComplete();
 * // unbind the event, so that our callback should not get called
 * myinstance.removeListener('scrolled', callback);
 * // this should now not fire the callback
 * myinstance.scrollComplete();
 */
var EventEmitter = function() {};
/**
 * Bind a callback to an event, with an option scope context
 *
 * @param {string} name the name of the event
 * @param {function} callback the callback function to fire when the event is triggered
 * @param {object} context the scope to use for the callback (which will become 'this' inside the callback)
 */
EventEmitter.prototype.on = function(name, callback, context) {
    if (!context) context = this;
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[name]) this._listeners[name] = [];
    if (!this._unbinders) this._unbinders = {};
    if (!this._unbinders[name]) this._unbinders[name] = [];
    var f = function(e) {
        callback.apply(context, [e]);
    };
    this._unbinders[name].push(callback);
    this._listeners[name].push(f);
};
/**
 * Trigger an event, firing all bound callbacks
 * 
 * @param {string} name the name of the event
 * @param {object} event the event object to be passed through to the callback
 */
EventEmitter.prototype.trigger = function(name, event) {
    if (event === undefined) event = {}
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[name]) return;
    var i = this._listeners[name].length;
    while (i--) this._listeners[name][i](event);
};
/**
 * Remove a bound listener
 * 
 * @param {string} name the name of the event
 * @param {object} event the event object to be passed through to the callback
 */
EventEmitter.prototype.removeListener = function(name, callback) {
    if (!this._unbinders) this._unbinders = {};
    if (!this._unbinders[name]) return;
    var i = this._unbinders[name].length;
    while (i--) {
        if (this._unbinders[name][i] === callback) {
            this._unbinders[name].splice(i, 1);
            this._listeners[name].splice(i, 1);
        }
    }
};
/**
 * Augment an object with the EventEmitter mixin
 * 
 * @param {object} obj The object to be augmented (often an object's protoype)
 */
EventEmitter.augment = function(obj) {
    for (var method in EventEmitter.prototype) {
        if (!obj[method]) obj[method] = EventEmitter.prototype[method];
    }
};
// BigInteger monkey patching
BigInteger.valueOf = nbv;

/**
 * Returns a byte array representation of the big integer.
 *
 * This returns the absolute of the contained value in big endian
 * form. A value of zero results in an empty array.
 */
BigInteger.prototype.toByteArrayUnsigned = function () {
  var ba = this.abs().toByteArray();
  if (ba.length) {
    if (ba[0] == 0) {
      ba = ba.slice(1);
    }
    return ba.map(function (v) {
      return (v < 0) ? v + 256 : v;
    });
  } else {
    // Empty array, nothing to do
    return ba;
  }
};

/**
 * Turns a byte array into a big integer.
 *
 * This function will interpret a byte array as a big integer in big
 * endian notation and ignore leading zeros.
 */
BigInteger.fromByteArrayUnsigned = function (ba) {
  if (!ba.length) {
    return ba.valueOf(0);
  } else if (ba[0] & 0x80) {
    // Prepend a zero so the BigInteger class doesn't mistake this
    // for a negative integer.
    return new BigInteger([0].concat(ba));
  } else {
    return new BigInteger(ba);
  }
};

/**
 * Converts big integer to signed byte representation.
 *
 * The format for this value uses a the most significant bit as a sign
 * bit. If the most significant bit is already occupied by the
 * absolute value, an extra byte is prepended and the sign bit is set
 * there.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0x81
 *    127 =>     0x7f
 *   -127 =>     0xff
 *    128 =>   0x0080
 *   -128 =>   0x8080
 *    255 =>   0x00ff
 *   -255 =>   0x80ff
 *  16300 =>   0x3fac
 * -16300 =>   0xbfac
 *  62300 => 0x00f35c
 * -62300 => 0x80f35c
 */
BigInteger.prototype.toByteArraySigned = function () {
  var val = this.abs().toByteArrayUnsigned();
  var neg = this.compareTo(BigInteger.ZERO) < 0;

  if (neg) {
    if (val[0] & 0x80) {
      val.unshift(0x80);
    } else {
      val[0] |= 0x80;
    }
  } else {
    if (val[0] & 0x80) {
      val.unshift(0x00);
    }
  }

  return val;
};

/**
 * Parse a signed big integer byte representation.
 *
 * For details on the format please see BigInteger.toByteArraySigned.
 */
BigInteger.fromByteArraySigned = function (ba) {
  // Check for negative value
  if (ba[0] & 0x80) {
    // Remove sign bit
    ba[0] &= 0x7f;

    return BigInteger.fromByteArrayUnsigned(ba).negate();
  } else {
    return BigInteger.fromByteArrayUnsigned(ba);
  }
};

// Console ignore
var names = ["log", "debug", "info", "warn", "error", "assert", "dir",
             "dirxml", "group", "groupEnd", "time", "timeEnd", "count",
             "trace", "profile", "profileEnd"];

if ("undefined" == typeof window.console) window.console = {};
for (var i = 0; i < names.length; ++i)
  if ("undefined" == typeof window.console[names[i]])
    window.console[names[i]] = function() {};

// Bitcoin utility functions
Bitcoin.Util = {
  /**
   * Cross-browser compatibility version of Array.isArray.
   */
  isArray: Array.isArray || function(o)
  {
    return Object.prototype.toString.call(o) === '[object Array]';
  },

  /**
   * Create an array of a certain length filled with a specific value.
   */
  makeFilledArray: function (len, val)
  {
    var array = [];
    var i = 0;
    while (i < len) {
      array[i++] = val;
    }
    return array;
  },

  /**
   * Turn an integer into a "var_int".
   *
   * "var_int" is a variable length integer used by Bitcoin's binary format.
   *
   * NOTE:  This function was just buggy in the original implementation.
   *
   * Returns a byte array.
   */
  numToVarInt: function (i) {
    if (i < 0xfd) {
      // unsigned char
      return [i];
    } else if (i <= 1<<16) {
      // unsigned short (LE)
      return [0xfd, i & 255, i >>> 8];    // little endian!
    } else if (i <= 1<<32) {
      // unsigned int (LE)
      return [0xfe].concat(Crypto.util.wordsToBytes([i]).reverse());  // little endian!
    } else {
      throw "long long not implemented";
      // unsigned long long (LE)
      //return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]).reverse());
    }
  },

  /**
   * Parse a Bitcoin value byte array, returning a BigInteger.
   */
  valueToBigInt: function (valueBuffer)
  {
    if (valueBuffer instanceof BigInteger) return valueBuffer;

    // Prepend zero byte to prevent interpretation as negative integer
    return BigInteger.fromByteArrayUnsigned(valueBuffer);
  },

  /**
   * Format a Bitcoin value as a string.
   *
   * Takes a BigInteger or byte-array and returns that amount of Bitcoins in a
   * nice standard formatting.
   *
   * Examples:
   * 12.3555
   * 0.1234
   * 900.99998888
   * 34.00
   */
  formatValue: function (valueBuffer) {
    var value = this.valueToBigInt(valueBuffer).toString();
    var integerPart = value.length > 8 ? value.substr(0, value.length-8) : '0';
    var decimalPart = value.length > 8 ? value.substr(value.length-8) : value;
    while (decimalPart.length < 8) decimalPart = "0"+decimalPart;
    decimalPart = decimalPart.replace(/0*$/, '');
    while (decimalPart.length < 2) decimalPart += "0";
    return integerPart+"."+decimalPart;
  },

  /**
   * Parse a floating point string as a Bitcoin value.
   *
   * Keep in mind that parsing user input is messy. You should always display
   * the parsed value back to the user to make sure we understood his input
   * correctly.
   */
  parseValue: function (valueString) {
    // TODO: Detect other number formats (e.g. comma as decimal separator)
    var valueComp = valueString.split('.');
    var integralPart = valueComp[0];
    var fractionalPart = valueComp[1] || "0";
    while (fractionalPart.length < 8) fractionalPart += "0";
    fractionalPart = fractionalPart.replace(/^0+/g, '');
    var value = BigInteger.valueOf(parseInt(integralPart));
    value = value.multiply(BigInteger.valueOf(100000000));
    value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
    return value;
  },

  /**
   * Calculate RIPEMD160(SHA256(data)).
   *
   * Takes an arbitrary byte array as inputs and returns the hash as a byte
   * array.
   */
  sha256ripe160: function (data) {
    return Crypto.RIPEMD160(Crypto.SHA256(data, {asBytes: true}), {asBytes: true});
  },

  /**
   * Calculate SHA256(SHA256(data)).
   *
   * Takes an arbitrary byte array as inputs and returns the doubly hashed
   * data as a byte array.
   */
  dsha256: function (data) {
    return Crypto.SHA256(Crypto.SHA256(data, { asBytes: true }), { asBytes: true });
  }
};

for (var i in Crypto.util) {
  if (Crypto.util.hasOwnProperty(i)) {
    Bitcoin.Util[i] = Crypto.util[i];
  }
}
(function (Bitcoin) {
  Bitcoin.Base58 = {
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    validRegex: /^[1-9A-HJ-NP-Za-km-z]+$/,
    base: BigInteger.valueOf(58),

    /**
     * Convert a byte array to a base58-encoded string.
     *
     * Written by Mike Hearn for BitcoinJ.
     *   Copyright (c) 2011 Google Inc.
     *
     * Ported to JavaScript by Stefan Thomas.
     */
    encode: function (input) {
      var bi = BigInteger.fromByteArrayUnsigned(input);
      var chars = [];

      while (bi.compareTo(B58.base) >= 0) {
        var mod = bi.mod(B58.base);
        chars.unshift(B58.alphabet[mod.intValue()]);
        bi = bi.subtract(mod).divide(B58.base);
      }
      chars.unshift(B58.alphabet[bi.intValue()]);

      // Convert leading zeros too.
      for (var i = 0; i < input.length; i++) {
        if (input[i] == 0x00) {
          chars.unshift(B58.alphabet[0]);
        } else break;
      }

      return chars.join('');
    },

    /**
     * Convert a base58-encoded string to a byte array.
     *
     * Written by Mike Hearn for BitcoinJ.
     *   Copyright (c) 2011 Google Inc.
     *
     * Ported to JavaScript by Stefan Thomas.
     */
    decode: function (input) {
      var bi = BigInteger.valueOf(0);
      var leadingZerosNum = 0;
      for (var i = input.length - 1; i >= 0; i--) {
        var alphaIndex = B58.alphabet.indexOf(input[i]);
        if (alphaIndex < 0) {
          throw "Invalid character";
        }	
        bi = bi.add(BigInteger.valueOf(alphaIndex)
                    .multiply(B58.base.pow(input.length - 1 -i)));

        // This counts leading zero bytes
        if (input[i] == "1") leadingZerosNum++;
        else leadingZerosNum = 0;
      }
      var bytes = bi.toByteArrayUnsigned();

      // Add leading zeros
      while (leadingZerosNum-- > 0) bytes.unshift(0);

      return bytes;
    },

    encodeFromString: function(str) {
      if(typeof str !== 'string') {
        throw 'input must be a string';
      }
      var bytes = [];
      for (var i = 0; i < str.length; ++i) {
        bytes.push(str.charCodeAt(i));
      }
      return this.encode(bytes);
    },

    decodeToString: function(encoded) {
      if(typeof encoded !== 'string') {
        throw 'input must be a string';
      }
      var str = '';
      var bytes = this.decode(encoded);
      for (var i = 0; i < bytes.length; ++i) {
        str += String.fromCharCode(parseInt(bytes[i], 10));
      }
      return str;
    }

  };

  var B58 = Bitcoin.Base58;
})(
  'undefined' != typeof Bitcoin ? Bitcoin : module.exports
);
Bitcoin.BIP38 = (function () {

  var BIP38 = function() {};


  /**
   * Standard bitcoin curve - secp256k1
   */
  var ecparams = getSECCurveByName("secp256k1");

  /**
   * Random number generator
   */
  var rng = new SecureRandom();

  /**
   * Default parameters for scrypt key derivation
   *  -> N: cpu cost
   *  -> r: memory cost
   *  -> p: parallelization cost
   */
  var scryptParams = {
    passphrase: { N: 16384, r: 8, p: 8 },        // Way too slow (especially on IE), but recommended values
    passphraseFast: { N: 2048, r: 4, p: 4 },
    passpoint: { N: 1024, r: 1, p: 1 }
  };

  /**
   * Default parameters for AES
   */
  var AES_opts = {mode: new Crypto.mode.ECB(Crypto.pad.NoPadding), asBytes: true};



  /**
   * Private key encoded per BIP-38 (password encrypted, checksum,  base58)
   * @author scintill
   */
  BIP38.encode = function (eckey, passphrase) {
    var privKeyBytes = eckey.getPrivateKeyByteArray();
    var address = eckey.getBitcoinAddress().toString();
  
    // compute sha256(sha256(address)) and take first 4 bytes
    var salt = Bitcoin.Util.dsha256(address).slice(0, 4);
  
    // derive key using scrypt
    var derivedBytes = Bitcoin.scrypt(passphrase, salt, scryptParams.passphraseFast.N, scryptParams.passphraseFast.r, scryptParams.passphraseFast.p, 64);
    for(var i = 0; i < 32; ++i) {
      privKeyBytes[i] ^= derivedBytes[i];
    }
  
    // 0x01 0x42 + flagbyte + salt + encryptedhalf1 + encryptedhalf2
    var flagByte = eckey.compressed ? 0xe0 : 0xc0;
    var encryptedKey = [ 0x01, 0x42, flagByte ].concat(salt);

    var encryptedKey = encryptedKey.concat(Crypto.AES.encrypt(privKeyBytes, derivedBytes.slice(32), AES_opts));
  
    encryptedKey = encryptedKey.concat(Bitcoin.Util.dsha256(encryptedKey).slice(0,4));

    return Bitcoin.Base58.encode(encryptedKey);
  }

  /**
   * Parse a wallet import format private key contained in a string.
   * @author scintill
   */
  BIP38.decode = function (base58Encrypted, passphrase) {
    var hex;
    try {
      hex = Bitcoin.Base58.decode(base58Encrypted);
    } catch (e) {
      throw new Error("Invalid BIP38-encrypted private key. Unable to decode base58.");
    }
  
    if (hex.length != 43) {
      throw new Error("Invalid BIP38-encrypted private key. Length of key in hex format is not 43 characters in length.");
    } else if (hex[0] != 0x01) {
      throw new Error("Invalid BIP38-encrypted private key. First byte is not 0x01.");
    }
  
    var expChecksum = hex.slice(-4);
    hex = hex.slice(0, -4);
  
    var checksum = Bitcoin.Util.dsha256(hex);
    if (checksum[0] != expChecksum[0] || checksum[1] != expChecksum[1] || checksum[2] != expChecksum[2] || checksum[3] != expChecksum[3]) {
      throw new Error("Invalid BIP38-encrypted private key. Checksum failed.");
    }
  
    var isCompPoint = false;
    var isECMult = false;
    var hasLotSeq = false;
    if (hex[1] == 0x42) {
      if (hex[2] == 0xe0) {
        isCompPoint = true;
      } else if (hex[2] != 0xc0) {
        throw new Error("Invalid BIP38-encrypted private key. Second byte should be 0xc0.");
      }
    } else if (hex[1] == 0x43) {
      isECMult = true;
      isCompPoint = (hex[2] & 0x20) != 0;
      hasLotSeq = (hex[2] & 0x04) != 0;
      if ((hex[2] & 0x24) != hex[2]) {
        throw new Error("Invalid BIP38-encrypted private key. Unknown validation error.");
      }
    } else {
      throw new Error("Invalid BIP38-encrypted private key. Unknown validation error.");
    }
  
    var decrypted;
    var verifyHashAndReturn = function() {
      var tmpkey = new Bitcoin.ECKey(decrypted);
      tmpkey.setCompressed(isCompPoint);
      
      var address = tmpkey.getBitcoinAddress();
      checksum = Bitcoin.Util.dsha256(address.toString());
  
      if (checksum[0] != hex[3] || checksum[1] != hex[4] || checksum[2] != hex[5] || checksum[3] != hex[6]) {
        throw new Error("Invalid BIP38-encrypted private key. Hash could not be verified.");
      }
  
      return tmpkey;
    };
  
    if (!isECMult) {
      var addresshash = hex.slice(3, 7);
      var derivedBytes = Bitcoin.scrypt(passphrase, addresshash, scryptParams.passphraseFast.N, scryptParams.passphraseFast.r, scryptParams.passphraseFast.p, 64);
      var k = derivedBytes.slice(32, 32+32);
      decrypted = Crypto.AES.decrypt(hex.slice(7, 7+32), k, AES_opts);
      for (var x = 0; x < 32; x++) decrypted[x] ^= derivedBytes[x];
      return verifyHashAndReturn();
    } else {
      var ownerentropy = hex.slice(7, 7+8);
      var ownersalt = !hasLotSeq ? ownerentropy : ownerentropy.slice(0, 4);
      var prefactorA = Bitcoin.scrypt(passphrase, ownersalt, scryptParams.passphraseFast.N, scryptParams.passphraseFast.r, scryptParams.passphraseFast.p, 32);
      var passfactor;
      if (!hasLotSeq) {
        passfactor = prefactorA;
      } else {
        var prefactorB = prefactorA.concat(ownerentropy);
        passfactor = Bitcoin.Util.dsha256(prefactorB);
      }
      var kp = new Bitcoin.ECKey(passfactor);
      kp.compressed = true;
      var passpoint = kp.getPub();
  
      var encryptedPart2 = hex.slice(23, 23+16);
  
      var addressHashPlusOnwerEntropy = hex.slice(3, 3+12);
      var derived = Bitcoin.scrypt(passpoint, addressHashPlusOnwerEntropy, scryptParams.passpoint.N, scryptParams.passpoint.r, scryptParams.passpoint.p, 64);
      var k = derived.slice(32);
  
      var unencryptedPart2 = Crypto.AES.decrypt(encryptedPart2, k, AES_opts);
      for (var i = 0; i < 16; i++) { unencryptedPart2[i] ^= derived[i+16]; }
  
      var encryptedpart1 = hex.slice(15, 15+8).concat(unencryptedPart2.slice(0, 0+8));
      var unencryptedpart1 = Crypto.AES.decrypt(encryptedpart1, k, AES_opts);
      for (var i = 0; i < 16; i++) { unencryptedpart1[i] ^= derived[i]; }
  
      var seedb = unencryptedpart1.slice(0, 0+16).concat(unencryptedPart2.slice(8, 8+8));
  
      var factorb = Bitcoin.Util.dsha256(seedb);
  
      var privateKey = BigInteger.fromByteArrayUnsigned(passfactor).multiply(BigInteger.fromByteArrayUnsigned(factorb)).remainder(ecparams.getN());
  
      decrypted = privateKey.toByteArrayUnsigned();
      return verifyHashAndReturn();
    }
  }

  /**
   * Generates an intermediate point based on a password which can later be used
   * to directly generate new BIP38-encrypted private keys without actually knowing
   * the password.
   * @author Zeilap
   */
  BIP38.generateIntermediate = function(passphrase, lotNum, sequenceNum) {
    var noNumbers = lotNum == null || sequenceNum == null;
    var ownerEntropy, ownerSalt;

    if(noNumbers) {
      ownerSalt = ownerEntropy = new Array(8);
      rng.nextBytes(ownerEntropy);
    } else {
      // 1) generate 4 random bytes
      var ownerSalt = Array(4);

      rng.nextBytes(ownerSalt);

      // 2)  Encode the lot and sequence numbers as a 4 byte quantity (big-endian):
      // lotnumber * 4096 + sequencenumber. Call these four bytes lotsequence.
      var lotSequence = nbv(4096*lotNum + sequenceNum).toByteArrayUnsigned();

      // 3) Concatenate ownersalt + lotsequence and call this ownerentropy.
      var ownerEntropy = ownerSalt.concat(lotSequence);
    }

    // 4) Derive a key from the passphrase using scrypt
    var prefactor = Bitcoin.scrypt(passphrase, ownerSalt, scryptParams.passphraseFast.N, scryptParams.passphraseFast.r, scryptParams.passphraseFast.p, 32);
 
    // Take SHA256(SHA256(prefactor + ownerentropy)) and call this passfactor
    var passfactorBytes = noNumbers? prefactor : Bitcoin.Util.dsha256(prefactor.concat(ownerEntropy));
    var passfactor = BigInteger.fromByteArrayUnsigned(passfactorBytes);

    // 5) Compute the elliptic curve point G * passfactor, and convert the result to compressed notation (33 bytes)
    var passpoint = ecparams.getG().multiply(passfactor).getEncoded(1);

    // 6) Convey ownersalt and passpoint to the party generating the keys, along with a checksum to ensure integrity.
    // magic bytes "2C E9 B3 E1 FF 39 E2 51" followed by ownerentropy, and then passpoint
    var magicBytes = [0x2C, 0xE9, 0xB3, 0xE1, 0xFF, 0x39, 0xE2, 0x51];
    if(noNumbers) magicBytes[7] = 0x53;

    var intermediatePreChecksum = magicBytes.concat(ownerEntropy).concat(passpoint);
    var intermediateBytes = intermediatePreChecksum.concat(Bitcoin.Util.dsha256(intermediatePreChecksum).slice(0,4));
    var intermediate = Bitcoin.Base58.encode(intermediateBytes);

    return intermediate;
  };

  /**
   * Creates new private key using an intermediate EC point.
   */
  BIP38.newAddressFromIntermediate = function(intermediate, compressed) {
    // validate intermediate code
    if (!BIP38.verifyIntermediate(intermediate)) {
      throw new Error("Invalid intermediate passphrase string");
    }

    // decode IPS
    var intermediateBytes = Bitcoin.Base58.decode(intermediate);
    var noNumbers = (intermediateBytes[7] === 0x53);
    var ownerEntropy = intermediateBytes.slice(8, 8+8);
    var passpoint = intermediateBytes.slice(16, 16+33);

    // 1) Set flagbyte.
    // set bit 0x20 for compressed key
    // set bit 0x04 if ownerentropy contains a value for lotsequence
    var flagByte = (compressed? 0x20 : 0x00) | (noNumbers? 0x00 : 0x04);

    // 2) Generate 24 random bytes, call this seedb.
    var seedB = new Array(24);
    rng.nextBytes(seedB);

    // Take SHA256(SHA256(seedb)) to yield 32 bytes, call this factorb.
    var factorB = Bitcoin.Util.dsha256(seedB);

    // 3) ECMultiply passpoint by factorb. Use the resulting EC point as a public key and hash it into a Bitcoin
    // address using either compressed or uncompressed public key methodology (specify which methodology is used
    // inside flagbyte). This is the generated Bitcoin address, call it generatedAddress.
    var ec = ecparams.getCurve();
    var generatedPoint = ec.decodePointHex(Crypto.util.bytesToHex(passpoint));
    var generatedBytes = generatedPoint.multiply(BigInteger.fromByteArrayUnsigned(factorB)).getEncoded(compressed);
    var generatedAddress = new Bitcoin.Address(Bitcoin.Util.sha256ripe160(generatedBytes));

    // 4) Take the first four bytes of SHA256(SHA256(generatedaddress)) and call it addresshash.
    var addressHash = Bitcoin.Util.dsha256(generatedAddress.toString()).slice(0,4);

    // 5) Now we will encrypt seedb. Derive a second key from passpoint using scrypt
    var derivedBytes = Bitcoin.scrypt(passpoint, addressHash.concat(ownerEntropy), scryptParams.passpoint.N, scryptParams.passpoint.r, scryptParams.passpoint.p, 64);

    // 6) Do AES256Encrypt(seedb[0...15]] xor derivedhalf1[0...15], derivedhalf2), call the 16-byte result encryptedpart1
    for(var i = 0; i < 16; ++i) {
      seedB[i] ^= derivedBytes[i];
    }
    var encryptedPart1 = Crypto.AES.encrypt(seedB.slice(0,16), derivedBytes.slice(32), AES_opts);

    // 7) Do AES256Encrypt((encryptedpart1[8...15] + seedb[16...23]) xor derivedhalf1[16...31], derivedhalf2), call the 16-byte result encryptedseedb.
    var message2 = encryptedPart1.slice(8, 8+8).concat(seedB.slice(16, 16+8));
    for(var i = 0; i < 16; ++i) {
      message2[i] ^= derivedBytes[i+16];
    }
    var encryptedSeedB = Crypto.AES.encrypt(message2, derivedBytes.slice(32), AES_opts);

    // 0x01 0x43 + flagbyte + addresshash + ownerentropy + encryptedpart1[0...7] + encryptedPart2
    var encryptedKey = [ 0x01, 0x43, flagByte ].concat(addressHash).concat(ownerEntropy).concat(encryptedPart1.slice(0,8)).concat(encryptedSeedB);

    // base58check encode
    encryptedKey = encryptedKey.concat(Bitcoin.Util.dsha256(encryptedKey).slice(0,4));

    // Generate confirmation code for the new address
    var confirmation = newAddressConfirmation(addressHash, factorB, derivedBytes, flagByte, ownerEntropy);

    return { address: generatedAddress,
             bip38PrivateKey: Bitcoin.Base58.encode(encryptedKey),
             confirmation: confirmation };
  };

  /**
   * Generates a confirmation code for a key/address generated using an intermediate
   * ec point (see BIP38.newAddressFromIntermediate).  This certifies that the address
   * truly corresponds to the password from which the intermediate ec point was derived
   * (see BIP38.verifyNewAddressConfirmation).
   */
  var newAddressConfirmation = function(addressHash, factorB, derivedBytes, flagByte, ownerEntropy) {
    // 1) ECMultiply factorb by G, call the result pointb. The result is 33 bytes.
    var pointb = ecparams.getG().multiply(BigInteger.fromByteArrayUnsigned(factorB)).getEncoded(1);

    // 2) he first byte is 0x02 or 0x03. XOR it by (derivedhalf2[31] & 0x01), call the resulting byte pointbprefix.
    var pointbprefix = pointb[0] ^ (derivedBytes[63] & 0x01);

    // 3) Do AES256Encrypt(pointb[1...16] xor derivedhalf1[0...15], derivedhalf2) and call the result pointbx1.
    for(var i = 0; i < 16; ++i) {
      pointb[i + 1] ^= derivedBytes[i];
    }
    var pointbx1 = Crypto.AES.encrypt(pointb.slice(1,17), derivedBytes.slice(32), AES_opts);
                        
    // 4) Do AES256Encrypt(pointb[17...32] xor derivedhalf1[16...31], derivedhalf2) and call the result pointbx2.
    for(var i = 16; i < 32; ++i) {
      pointb[i + 1] ^= derivedBytes[i];
    }
    var pointbx2 = Crypto.AES.encrypt(pointb.slice(17,33), derivedBytes.slice(32), AES_opts);

    var encryptedpointb = [ pointbprefix ].concat(pointbx1).concat(pointbx2);

    var confirmationPreChecksum =
      [ 0x64, 0x3B, 0xF6, 0xA8, 0x9A, flagByte ]
        .concat(addressHash)
        .concat(ownerEntropy)
        .concat(encryptedpointb);
    var confirmationBytes = confirmationPreChecksum.concat(Bitcoin.Util.dsha256(confirmationPreChecksum).slice(0,4));
    var confirmation = Bitcoin.Base58.encode(confirmationBytes);

    return confirmation;
  };

  /**
   * Certifies that the given address was generated using an intermediate ec point derived
   * from the given password (see BIP38.newAddressFromIntermediate).
   */
  BIP38.verifyNewAddressConfirmation = function(expectedAddressStr, confirmation, passphrase) {
    var confirmationResults = BIP38.verifyConfirmation(confirmation, passphrase);
    return (confirmationResults.address == expectedAddressStr);
  };

  /**
   * Certifies that the given BIP38 confirmation code matches the password and
   * returns the address the confirmation corresponds to (see BIP38.newAddressFromIntermediate).
   */
  BIP38.verifyConfirmation = function(confirmation, passphrase) {
    var bytes = Bitcoin.Base58.decode(confirmation);
                
    // Get the flag byte (tells us whether address compression is used and whether lot/sequence values are present).
    var flagByte = bytes[5];
                
    // Get the address hash.
    var addressHash = bytes.slice(6, 10);

    // Get the owner entropy (tells us the lot/sequence values when applicable).
    var ownerEntropy = bytes.slice(10, 18);

    // Get encryptedpointb
    var encryptedpointb = bytes.slice(18, 51);

    var compressed = (flagByte & 0x20) == 0x20;
    var lotSequencePresent = (flagByte & 0x04) == 0x04;
    var ownerSalt = ownerEntropy.slice(0, lotSequencePresent ? 4 : 8)

    var prefactor = Bitcoin.scrypt(passphrase, ownerSalt, scryptParams.passphraseFast.N, scryptParams.passphraseFast.r, scryptParams.passphraseFast.p, 32);

    // Take SHA256(SHA256(prefactor + ownerentropy)) and call this passfactor
    var passfactorBytes = !lotSequencePresent? prefactor : Bitcoin.Util.dsha256(prefactor.concat(ownerEntropy));
    var passfactor = BigInteger.fromByteArrayUnsigned(passfactorBytes);

    var passpoint = ecparams.getG().multiply(passfactor).getEncoded(1);

    var addresshashplusownerentropy = addressHash.concat(ownerEntropy);

    var derivedBytes = Bitcoin.scrypt(passpoint, addresshashplusownerentropy, scryptParams.passpoint.N, scryptParams.passpoint.r, scryptParams.passpoint.p, 64);

    // recover the 0x02 or 0x03 prefix
    var unencryptedpubkey = [];
    unencryptedpubkey[0] = encryptedpointb[0] ^ (derivedBytes[63] & 0x01);

    decrypted1 = Crypto.AES.decrypt(encryptedpointb.slice(1,17), derivedBytes.slice(32), AES_opts);
    decrypted2 = Crypto.AES.decrypt(encryptedpointb.slice(17,33), derivedBytes.slice(32), AES_opts);
    decrypted = unencryptedpubkey.concat(decrypted1).concat(decrypted2);

    for (var x = 0; x < 32; x++) { 
      decrypted[x+1] ^= derivedBytes[x];
    }

    var ec = ecparams.getCurve();
    var generatedPoint = ec.decodePointHex(Crypto.util.bytesToHex(decrypted).toString().toUpperCase());
    var generatedBytes = generatedPoint.multiply(BigInteger.fromByteArrayUnsigned(passfactor)).getEncoded(compressed);
    var generatedAddress = (new Bitcoin.Address(Bitcoin.Util.sha256ripe160(generatedBytes))).toString();

    var generatedAddressHash = Bitcoin.Util.dsha256(generatedAddress).slice(0,4);

    var valid = true;
    for (var i = 0; i < 4; i++) {
      if (addressHash[i] != generatedAddressHash[i]) {
        valid = false;
      }
    }
   
    return { valid: valid, address: generatedAddress };
  }

  /**
   * Checks the validity of an intermediate code.
   */
  BIP38.verifyIntermediate = function (intermediate) {
    // Simple regex check
    var regexValid = (/^passphrase[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(intermediate));
    if (!regexValid) return false;

    // Correct bytelen
    var intermediateBytes = Bitcoin.Base58.decode(intermediate);
    if (intermediateBytes.length != 53)  return false;

    // Checksum check
    var expectedChecksum = intermediateBytes.slice(49,53);
    var checksum = Bitcoin.Util.dsha256(intermediateBytes.slice(0, 49)).slice(0, 4);
    if (expectedChecksum[0] != checksum[0] ||
        expectedChecksum[1] != checksum[1] ||
        expectedChecksum[2] != checksum[2] ||
        expectedChecksum[3] != checksum[3]) {
          return false;
    }

    return true;
  }
 
  /**
   * Detects keys encrypted according to BIP-38 (58 base58 characters starting with 6P)
   */
  BIP38.isBIP38Format = function (string) {
    return (/^6P[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{56}$/.test(string));
  };


  return BIP38;

})();

(function () {

  var Address = Bitcoin.Address = function (input, version) {
    if ("string" == typeof input) {
      this.fromString(input);
      return this;
    }
 
    if (input instanceof Bitcoin.ECKey) {
      input = input.getPubKeyHash();
    }

    if (!(input instanceof Array)) {
      throw "can't convert to address";
    }

    this.hash = input;
    this.version = version || Bitcoin.Address.pubKeyHashVersion;
  };

  /**
   * Serialize this object as a standard Bitcoin address.
   *
   * Returns the address as a base58-encoded string in the standardized format.
   */
  Address.prototype.toString = function () {
    // Get a copy of the hash
    var hash = this.hash.slice(0);

    // Version
    hash.unshift(this.version);
  
    var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});
  
    var bytes = hash.concat(checksum.slice(0,4));
  
    return Bitcoin.Base58.encode(bytes);
  };
  
  Address.prototype.getHashBase64 = function () {
    return Crypto.util.bytesToBase64(this.hash);
  };
  
  Address.decodeString = function(string) {
    throw "Bitcoin.Address.decodeString is depricated";
  }
  
  /**
   * Parse a Bitcoin address contained in a string.
   */
  Address.prototype.fromString = function (string) {
    var bytes = Bitcoin.Base58.decode(string);
  
    var hash = bytes.slice(0, 21);
  
    var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});
  
    if (checksum[0] != bytes[21] ||
        checksum[1] != bytes[22] ||
        checksum[2] != bytes[23] ||
        checksum[3] != bytes[24]) {
      throw "Checksum validation failed!";
    }
  
    this.version = hash.shift();
    this.hash = hash;
  
    if (this.version != Bitcoin.Address.pubKeyHashVersion &&
        this.version != Bitcoin.Address.p2shVersion) {
      throw "Version " + this.version + " not supported!";
    }
  };
  
  Address.createMultiSigAddress = function(keys, numRequired) {
    if (numRequired < 0 || numRequired > keys.length || numRequired > 16) { throw "invalid number of keys required" }
    for (var index = 0; index < keys.length; ++index) {
      if (Object.prototype.toString.call(keys[index]) != '[object Array]') { throw "pub keys are not of right type"; }
    }
  
    var redeemScript = Bitcoin.Script.createMultiSigScript(numRequired, keys);
    var bytes = redeemScript.buffer;
    var hash = Bitcoin.Util.sha256ripe160(bytes);
    var address = new Bitcoin.Address(hash);
    address.redeemScript = bytes;
    address.version = Bitcoin.Address.p2shVersion;
    return address;
  }
  
  Address.prototype.isP2SHAddress = function() {
    return this.version == Bitcoin.Address.p2shVersion;
  }
  
  Address.prototype.isPubKeyHashAddress = function() {
    return this.version == Bitcoin.Address.pubKeyHashVersion;
  }
  
  Address.validate = function(addressString)  {
    try {
      var address = new Bitcoin.Address(addressString);
    } catch (e) {
      return false;  // invalid address.
    }
    return true;
  }
  
  // Create a bitcoin address from a public key.
  Address.fromPubKey = function(pubKey) {
    return new Bitcoin.Address(Bitcoin.Util.sha256ripe160(pubKey));
  }
})();
function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
    bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
    bytes.unshift(0);
  }

  return bytes;
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};

ECPointFp.prototype.getEncoded = function (compressed) {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();

  // Get value as a 32-byte Buffer
  // Fixed length based on a patch by bitaddress.org and Casascius
  var enc = integerToBytes(x, 32);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc.unshift(0x02);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc.unshift(0x03);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc.unshift(0x04);
    enc = enc.concat(integerToBytes(y, 32));
  }
  return enc;
};

ECPointFp.decodeFrom = function (curve, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as byte arrays
  var xBa = enc.slice(1, 1 + dataLen/2);
  var yBa = enc.slice(1 + dataLen/2, 1 + dataLen);

  // Prepend zero byte to prevent interpretation as negative integer
  xBa.unshift(0);
  yBa.unshift(0);

  // Convert to BigIntegers
  var x = new BigInteger(xBa);
  var y = new BigInteger(yBa);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = y.multiply(y).mod(n);
  var rhs = x.multiply(x).multiply(x)
    .add(a.multiply(x)).add(b).mod(n);
  return lhs.equals(rhs);
};

ECPointFp.prototype.toString = function () {
  return '('+this.getX().toBigInteger().toString()+','+
    this.getY().toBigInteger().toString()+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
    throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
      x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
      y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
    throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
    // TODO: This check doesn't work - fix.
    throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};

function dmp(v) {
  if (!(v instanceof BigInteger)) v = v.toBigInteger();
  return Crypto.util.bytesToHex(v.toByteArrayUnsigned());
};

Bitcoin.ECDSA = (function () {
  var ecparams = getSECCurveByName("secp256k1");
  var rng = new SecureRandom();

  var P_OVER_FOUR = null;

  function implShamirsTrick(P, k, Q, l)
  {
    var m = Math.max(k.bitLength(), l.bitLength());
    var Z = P.add2D(Q);
    var R = P.curve.getInfinity();

    for (var i = m - 1; i >= 0; --i) {
      R = R.twice2D();

      R.z = BigInteger.ONE;

      if (k.testBit(i)) {
        if (l.testBit(i)) {
          R = R.add2D(Z);
        } else {
          R = R.add2D(P);
        }
      } else {
        if (l.testBit(i)) {
          R = R.add2D(Q);
        }
      }
    }

    return R;
  };

  var ECDSA = {
    getBigRandom: function (limit) {
      return new BigInteger(limit.bitLength(), rng)
        .mod(limit.subtract(BigInteger.ONE))
        .add(BigInteger.ONE)
      ;
    },
    sign: function (hash, priv) {
      var d = priv;
      var n = ecparams.getN();
      var e = BigInteger.fromByteArrayUnsigned(hash);

      do {
        var k = ECDSA.getBigRandom(n);
        var G = ecparams.getG();
        var Q = G.multiply(k);
        var r = Q.getX().toBigInteger().mod(n);
      } while (r.compareTo(BigInteger.ZERO) <= 0);

      var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

      return ECDSA.serializeSig(r, s);
    },

    verify: function (hash, sig, pubkey) {
      var r,s;
      if (Bitcoin.Util.isArray(sig)) {
        var obj = ECDSA.parseSig(sig);
        r = obj.r;
        s = obj.s;
      } else if ("object" === typeof sig && sig.r && sig.s) {
        r = sig.r;
        s = sig.s;
      } else {
        throw "Invalid value for signature";
      }

      var Q;
      if (pubkey instanceof ECPointFp) {
        Q = pubkey;
      } else if (Bitcoin.Util.isArray(pubkey)) {
        Q = ECPointFp.decodeFrom(ecparams.getCurve(), pubkey);
      } else {
        throw "Invalid format for pubkey value, must be byte array or ECPointFp";
      }
      var e = BigInteger.fromByteArrayUnsigned(hash);

      return ECDSA.verifyRaw(e, r, s, Q);
    },

    verifyRaw: function (e, r, s, Q) {
      var n = ecparams.getN();
      var G = ecparams.getG();

      if (r.compareTo(BigInteger.ONE) < 0 ||
          r.compareTo(n) >= 0)
        return false;

      if (s.compareTo(BigInteger.ONE) < 0 ||
          s.compareTo(n) >= 0)
        return false;

      var c = s.modInverse(n);

      var u1 = e.multiply(c).mod(n);
      var u2 = r.multiply(c).mod(n);

      // TODO(!!!): For some reason Shamir's trick isn't working with
      // signed message verification!? Probably an implementation
      // error!
      //var point = implShamirsTrick(G, u1, Q, u2);
      var point = G.multiply(u1).add(Q.multiply(u2));

      var v = point.getX().toBigInteger().mod(n);

      return v.equals(r);
    },

    /**
     * Serialize a signature into DER format.
     *
     * Takes two BigIntegers representing r and s and returns a byte array.
     */
    serializeSig: function (r, s) {
      var rBa = r.toByteArraySigned();
      var sBa = s.toByteArraySigned();

      var sequence = [];
      sequence.push(0x02); // INTEGER
      sequence.push(rBa.length);
      sequence = sequence.concat(rBa);

      sequence.push(0x02); // INTEGER
      sequence.push(sBa.length);
      sequence = sequence.concat(sBa);

      sequence.unshift(sequence.length);
      sequence.unshift(0x30); // SEQUENCE

      return sequence;
    },

    /**
     * Parses a byte array containing a DER-encoded signature.
     *
     * This function will return an object of the form:
     *
     * {
     *   r: BigInteger,
     *   s: BigInteger
     * }
     */
    parseSig: function (sig) {
      var cursor;
      if (sig[0] != 0x30)
        throw new Error("Signature not a valid DERSequence");

      cursor = 2;
      if (sig[cursor] != 0x02)
        throw new Error("First element in signature must be a DERInteger");;
      var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

      cursor += 2+sig[cursor+1];
      if (sig[cursor] != 0x02)
        throw new Error("Second element in signature must be a DERInteger");
      var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

      cursor += 2+sig[cursor+1];

      //if (cursor != sig.length)
      //  throw new Error("Extra bytes in signature");

      var r = BigInteger.fromByteArrayUnsigned(rBa);
      var s = BigInteger.fromByteArrayUnsigned(sBa);

      return {r: r, s: s};
    },

    parseSigCompact: function (sig) {
      if (sig.length !== 65) {
        throw "Signature has the wrong length";
      }

      // Signature is prefixed with a type byte storing three bits of
      // information.
      var i = sig[0] - 27;
      if (i < 0 || i > 7) {
        throw "Invalid signature type";
      }

      var n = ecparams.getN();
      var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
      var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

      return {r: r, s: s, i: i};
    },

    /**
     * Recover a public key from a signature.
     *
     * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
     * Key Recovery Operation".
     *
     * http://www.secg.org/download/aid-780/sec1-v2.pdf
     */
    recoverPubKey: function (r, s, hash, i) {
      // The recovery parameter i has two bits.
      i = i & 3;

      // The less significant bit specifies whether the y coordinate
      // of the compressed point is even or not.
      var isYEven = i & 1;

      // The more significant bit specifies whether we should use the
      // first or second candidate key.
      var isSecondKey = i >> 1;

      var n = ecparams.getN();
      var G = ecparams.getG();
      var curve = ecparams.getCurve();
      var p = curve.getQ();
      var a = curve.getA().toBigInteger();
      var b = curve.getB().toBigInteger();

      // We precalculate (p + 1) / 4 where p is if the field order
      if (!P_OVER_FOUR) {
        P_OVER_FOUR = p.add(BigInteger.ONE).divide(BigInteger.valueOf(4));
      }

      // 1.1 Compute x
      var x = isSecondKey ? r.add(n) : r;

      // 1.3 Convert x to point
      var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
      var beta = alpha.modPow(P_OVER_FOUR, p);

      var xorOdd = beta.isEven() ? (i % 2) : ((i+1) % 2);
      // If beta is even, but y isn't or vice versa, then convert it,
      // otherwise we're done and y == beta.
      var y = (beta.isEven() ? !isYEven : isYEven) ? beta : p.subtract(beta);

      // 1.4 Check that nR is at infinity
      var R = new ECPointFp(curve,
                            curve.fromBigInteger(x),
                            curve.fromBigInteger(y));
      R.validate();

      // 1.5 Compute e from M
      var e = BigInteger.fromByteArrayUnsigned(hash);
      var eNeg = BigInteger.ZERO.subtract(e).mod(n);

      // 1.6 Compute Q = r^-1 (sR - eG)
      var rInv = r.modInverse(n);
      var Q = implShamirsTrick(R, s, G, eNeg).multiply(rInv);

      Q.validate();
      if (!ECDSA.verifyRaw(e, r, s, Q)) {
        throw "Pubkey recovery unsuccessful";
      }

      var pubKey = new Bitcoin.ECKey();
      pubKey.setPub(Q.getEncoded());
      return pubKey;
    },

    /**
     * Calculate pubkey extraction parameter.
     *
     * When extracting a pubkey from a signature, we have to
     * distinguish four different cases. Rather than putting this
     * burden on the verifier, Bitcoin includes a 2-bit value with the
     * signature.
     *
     * This function simply tries all four cases and returns the value
     * that resulted in a successful pubkey recovery.
     */
    calcPubkeyRecoveryParam: function (address, r, s, hash)
    {
      for (var i = 0; i < 4; i++) {
        try {
          var pubkey = Bitcoin.ECDSA.recoverPubKey(r, s, hash, i);
          if (pubkey.getBitcoinAddress().toString() == address) {
            return i;
          }
        } catch (e) {}
      }
      throw "Unable to find valid recovery factor";
    }
  };

  return ECDSA;
})();
Bitcoin.ECKey = (function () {
  var ECDSA = Bitcoin.ECDSA;
  var ecparams = getSECCurveByName("secp256k1");
  var rng = new SecureRandom();

  var ECKey = function (input) {
    if (!input) {
      // Generate new key
      var n = ecparams.getN();
      this.priv = ECDSA.getBigRandom(n);
    } else if (input instanceof BigInteger) {
      // Input is a private key value
      this.priv = input;
    } else if (Bitcoin.Util.isArray(input)) {
      // Prepend zero byte to prevent interpretation as negative integer
      this.priv = BigInteger.fromByteArrayUnsigned(input);
    } else if ("string" == typeof input) {
      var bytes = null;
      if (ECKey.isWalletImportFormat(input)) {
        bytes = ECKey.decodeWalletImportFormat(input);
      } else if (ECKey.isCompressedWalletImportFormat(input)) {
        bytes = ECKey.decodeCompressedWalletImportFormat(input);
        this.compressed = true;
      } else if (ECKey.isMiniFormat(input)) {
        bytes = Crypto.SHA256(input, { asBytes: true });
      } else if (ECKey.isHexFormat(input)) {
        bytes = Crypto.util.hexToBytes(input);
      } else if (ECKey.isBase64Format(input)) {
        bytes = Crypto.util.base64ToBytes(input);
      }

      if (bytes == null || bytes.length != 32) {
        this.priv = null;
      } else {
        // Prepend zero byte to prevent interpretation as negative integer
        this.priv = BigInteger.fromByteArrayUnsigned(bytes);
      }
    }

    this.compressed = (this.compressed == undefined) ? !!ECKey.compressByDefault : this.compressed;
  };

  ECKey.privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF

  /**
   * Whether public keys should be returned compressed by default.
   */
  ECKey.compressByDefault = false;

  /**
   * Set whether the public key should be returned compressed or not.
   */
  ECKey.prototype.setCompressed = function (v) {
    this.compressed = !!v;
    if (this.pubPoint) this.pubPoint.compressed = this.compressed;
    return this;
  };

  /**
   * Return public key as a byte array in DER encoding.
   */
  ECKey.prototype.getPub = function () {
    if (this.compressed) {
      if (this.pubComp) return this.pubComp;
      return this.pubComp = this.getPubPoint().getEncoded(1);
    } else {
      if (this.pubUncomp) return this.pubUncomp;
      return this.pubUncomp = this.getPubPoint().getEncoded(0);
    }
  };

  /**
   * Return public point as ECPoint object.
   */
  ECKey.prototype.getPubPoint = function () {
    if (!this.pubPoint) {
      this.pubPoint = ecparams.getG().multiply(this.priv);
      this.pubPoint.compressed = this.compressed;
    }
    return this.pubPoint;
  };

  /**
   * Return public key as hexadecimal string.
   */
  ECKey.prototype.getPubKeyHex = function () {
    if (this.compressed) {
      if (this.pubKeyHexComp) return this.pubKeyHexComp;
      return this.pubKeyHexComp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
    } else {
      if (this.pubKeyHexUncomp) return this.pubKeyHexUncomp;
      return this.pubKeyHexUncomp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
    }
  };

  /**
   * Get the pubKeyHash for this key.
   *
   * This is calculated as RIPE160(SHA256([encoded pubkey])) and returned as
   * a byte array.
   */
  ECKey.prototype.getPubKeyHash = function () {
    if (this.compressed) {
      if (this.pubKeyHashComp) return this.pubKeyHashComp;
      return this.pubKeyHashComp = Bitcoin.Util.sha256ripe160(this.getPub());
    } else {
      if (this.pubKeyHashUncomp) return this.pubKeyHashUncomp;
      return this.pubKeyHashUncomp = Bitcoin.Util.sha256ripe160(this.getPub());
    }
  };

  ECKey.prototype.getBitcoinAddress = function () {
    var hash = this.getPubKeyHash();
    var addr = new Bitcoin.Address(hash);
    return addr;
  };

  /*
   * Portions of the chaining code were taken from the javascript
   * armory code included in brainwallet.github.org.
   */


  /**
   * Chain a key to create a new key.  If this key is based from a private
   * key, it will create a private key chain.
   *
   * If this key is based on a public key, it will generate the public key of the chain.
   *
   * Chaincode must be a securely generated 32Byte random number.
   */
  ECKey.createPubKeyFromChain = function(pubKey, chainCode) {
    if (!Bitcoin.Util.isArray(chainCode)) {
      throw('chaincode must be a byte array');
    }
    var chainXor = Crypto.SHA256(Crypto.SHA256(pubKey, {asBytes: true}), {asBytes: true});
    for (var i = 0; i < 32; i++)
        chainXor[i] ^= chainCode[i];

    var A = BigInteger.fromByteArrayUnsigned(chainXor);
    var pt = ECPointFp.decodeFrom(ecparams.getCurve(), pubKey).multiply(A);

    var newPub = pt.getEncoded();
    return newPub;
  };

  ECKey.createECKeyFromChain = function(privKey, chainCode) {
    if (!Bitcoin.Util.isArray(chainCode)) {
      throw('chaincode must be a byte array');
    }
    var eckey = new ECKey(privKey);
    var privKey = eckey.priv;
    var pubKey = eckey.getPub();

    var chainXor = Crypto.SHA256(Crypto.SHA256(pubKey, {asBytes: true}), {asBytes: true});
    for (var i = 0; i < 32; i++)
        chainXor[i] ^= chainCode[i];

    var A = BigInteger.fromByteArrayUnsigned(chainXor);
    var B = BigInteger.fromByteArrayUnsigned(privKey);
    var C = ecparams.getN();
    var secexp = (A.multiply(B)).mod(C);
    var pt = ecparams.getG().multiply(secexp);

    var newPriv = secexp ? secexp.toByteArrayUnsigned() : [];
    return new ECKey(newPriv);
  };

  /**
   * Takes a public point as a hex string or byte array
   */
  ECKey.prototype.setPub = function (pub) {
    // byte array
    if (Bitcoin.Util.isArray(pub)) {
      pub = Crypto.util.bytesToHex(pub).toString().toUpperCase();
    }
    var ecPoint = ecparams.getCurve().decodePointHex(pub);
    this.setCompressed(ecPoint.compressed);
    this.pubPoint = ecPoint;
    return this;
  };

  /**
   * Private key encoded as standard Wallet Import Format (WIF)
   */
  ECKey.prototype.getWalletImportFormat = function () {
    var bytes = this.getPrivateKeyByteArray();
    bytes.unshift(ECKey.privateKeyPrefix); // prepend 0x80 byte
    if (this.compressed) bytes.push(0x01); // append 0x01 byte for compressed format
    var checksum = Bitcoin.Util.dsha256(bytes);
    bytes = bytes.concat(checksum.slice(0, 4));
    var privWif = Bitcoin.Base58.encode(bytes);
    return privWif;
  };

  /**
   * Private key encoded per BIP-38 (password encrypted, checksum,  base58)
   */
  ECKey.prototype.getEncryptedFormat = function (passphrase) {
    return Bitcoin.BIP38.encode(this, passphrase);
  }

  /**
   * Private key encoded as hexadecimal string.
   */
  ECKey.prototype.getHexFormat = function () {
    return Crypto.util.bytesToHex(this.getPrivateKeyByteArray()).toString().toUpperCase();
  };

  /**
   * Private key encoded as Base64 string.
   */
  ECKey.prototype.getBase64Format = function () {
    return Crypto.util.bytesToBase64(this.getPrivateKeyByteArray());
  };

  /**
   * Private key encoded as raw byte array.
   */
  ECKey.prototype.getPrivateKeyByteArray = function () {
    // Get a copy of private key as a byte array
    var bytes = this.priv.toByteArrayUnsigned();
    // zero pad if private key is less than 32 bytes 
    while (bytes.length < 32) bytes.unshift(0x00);
    return bytes;
  };

  ECKey.prototype.toString = function (format) {
    format = format || "";
    if (format.toString().toLowerCase() == "base64" || format.toString().toLowerCase() == "b64") {
      return this.getBase64Format(); // Base 64
    } else if (format.toString().toLowerCase() == "wif") {
      return this.getWalletImportFormat(); // Wallet Import Format
    } else {
      return this.getHexFormat(); // Hex
    }
  };

  ECKey.prototype.sign = function (hash) {
    return ECDSA.sign(hash, this.priv);
  };

  ECKey.prototype.verify = function (hash, sig) {
    return ECDSA.verify(hash, sig, this.getPubPoint());
  };

  /**
   * Parse a wallet import format private key contained in a string.
   */
  ECKey.decodeWalletImportFormat = function (privStr) {
    var bytes = Bitcoin.Base58.decode(privStr);

    var hash = bytes.slice(0, 33);

    var checksum = Bitcoin.Util.dsha256(hash);

    if (checksum[0] != bytes[33] ||
        checksum[1] != bytes[34] ||
        checksum[2] != bytes[35] ||
        checksum[3] != bytes[36]) {
      throw "Checksum validation failed!";
    }

    var version = hash.shift();

    if (version != ECKey.privateKeyPrefix) {
      throw "Version "+version+" not supported!";
    }

    return hash;
  };

  /**
   * Parse a compressed wallet import format private key contained in a string.
   */
  ECKey.decodeCompressedWalletImportFormat = function (privStr) {
    var bytes = Bitcoin.Base58.decode(privStr);
    var hash = bytes.slice(0, 34);
    var checksum = Bitcoin.Util.dsha256(hash);
    if (checksum[0] != bytes[34] ||
      checksum[1] != bytes[35] ||
      checksum[2] != bytes[36] ||
      checksum[3] != bytes[37]) {
        throw "Checksum validation failed!";
      }
    var version = hash.shift();
    if (version != ECKey.privateKeyPrefix) {
      throw "Version " + version + " not supported!";
    }
    hash.pop();
    return hash;
  };

  /**
   * Parse and decrypt a key encoded as a BIP38 string.
   */
  ECKey.decodeEncryptedFormat = function (base58Encrypted, passphrase) {
    return Bitcoin.BIP38.decode(base58Encrypted, passphrase);
  }

  /**
   * Detects keys in hex format (64 characters [0-9A-F]).
   */
  ECKey.isHexFormat = function (key) {
    key = key.toString();
    return /^[A-Fa-f0-9]{64}$/.test(key);
  };

  /**
   * Detects keys in base58 format (51 characters base58, always starts with a '5')
   */
  ECKey.isWalletImportFormat = function (key) {
    key = key.toString();
    return (ECKey.privateKeyPrefix == 0x80) ?
      (/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key)) :
      (/^9[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key));
  };

  /**
   * Detects keys in standard Wallet Import Format (52 characters base58)
   */
  ECKey.isCompressedWalletImportFormat = function (key) {
    key = key.toString();
    return (ECKey.privateKeyPrefix == ECKey.privateKeyPrefix) ?
      (/^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key)) :
      (/^c[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key));
  };

  /**
   * Detects keys in base64 format (44 characters)
   */
  ECKey.isBase64Format = function (key) {
    key = key.toString();
    return (/^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=+\/]{44}$/.test(key));
  };

  /**
   * Detects keys in 'mini' format (22, 26 or 30 characters, always starts with an 'S')
   */
  ECKey.isMiniFormat = function (key) {
    key = key.toString();
    var validChars22 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21}$/.test(key);
    var validChars26 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25}$/.test(key);
    var validChars30 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{29}$/.test(key);
    var testBytes = Crypto.SHA256(key + "?", { asBytes: true });

    return ((testBytes[0] === 0x00 || testBytes[0] === 0x01) && (validChars22 || validChars26 || validChars30));
  };

  /**
   * Detects keys encrypted according to BIP-38 (58 base58 characters starting with 6P)
   */
  ECKey.isBIP38Format = function (string) { return Bitcoin.BIP38.isBIP38Format(string); };

  return ECKey;
})();

(function () {
  var Opcode = Bitcoin.Opcode = function (num) {
    this.code = num;
  };

  Opcode.prototype.toString = function () {
    return Opcode.reverseMap[this.code];
  };

  Opcode.map = {
    // push value
    OP_0         : 0,
    OP_FALSE     : 0,
    OP_PUSHDATA1 : 76,
    OP_PUSHDATA2 : 77,
    OP_PUSHDATA4 : 78,
    OP_1NEGATE   : 79,
    OP_RESERVED  : 80,
    OP_1         : 81,
    OP_TRUE      : 81,
    OP_2         : 82,
    OP_3         : 83,
    OP_4         : 84,
    OP_5         : 85,
    OP_6         : 86,
    OP_7         : 87,
    OP_8         : 88,
    OP_9         : 89,
    OP_10        : 90,
    OP_11        : 91,
    OP_12        : 92,
    OP_13        : 93,
    OP_14        : 94,
    OP_15        : 95,
    OP_16        : 96,

    // control
    OP_NOP       : 97,
    OP_VER       : 98,
    OP_IF        : 99,
    OP_NOTIF     : 100,
    OP_VERIF     : 101,
    OP_VERNOTIF  : 102,
    OP_ELSE      : 103,
    OP_ENDIF     : 104,
    OP_VERIFY    : 105,
    OP_RETURN    : 106,

    // stack ops
    OP_TOALTSTACK   : 107,
    OP_FROMALTSTACK : 108,
    OP_2DROP        : 109,
    OP_2DUP         : 110,
    OP_3DUP         : 111,
    OP_2OVER        : 112,
    OP_2ROT         : 113,
    OP_2SWAP        : 114,
    OP_IFDUP        : 115,
    OP_DEPTH        : 116,
    OP_DROP         : 117,
    OP_DUP          : 118,
    OP_NIP          : 119,
    OP_OVER         : 120,
    OP_PICK         : 121,
    OP_ROLL         : 122,
    OP_ROT          : 123,
    OP_SWAP         : 124,
    OP_TUCK         : 125,

    // splice ops
    OP_CAT          : 126,
    OP_SUBSTR       : 127,
    OP_LEFT         : 128,
    OP_RIGHT        : 129,
    OP_SIZE         : 130,

    // bit logic
    OP_INVERT       : 131,
    OP_AND          : 132,
    OP_OR           : 133,
    OP_XOR          : 134,
    OP_EQUAL        : 135,
    OP_EQUALVERIFY  : 136,
    OP_RESERVED1    : 137,
    OP_RESERVED2    : 138,

    // numeric
    OP_1ADD         : 139,
    OP_1SUB         : 140,
    OP_2MUL         : 141,
    OP_2DIV         : 142,
    OP_NEGATE       : 143,
    OP_ABS          : 144,
    OP_NOT          : 145,
    OP_0NOTEQUAL    : 146,

    OP_ADD          : 147,
    OP_SUB          : 148,
    OP_MUL          : 149,
    OP_DIV          : 150,
    OP_MOD          : 151,
    OP_LSHIFT       : 152,
    OP_RSHIFT       : 153,

    OP_BOOLAND             : 154,
    OP_BOOLOR              : 155,
    OP_NUMEQUAL            : 156,
    OP_NUMEQUALVERIFY      : 157,
    OP_NUMNOTEQUAL         : 158,
    OP_LESSTHAN            : 159,
    OP_GREATERTHAN         : 160,
    OP_LESSTHANOREQUAL     : 161,
    OP_GREATERTHANOREQUAL  : 162,
    OP_MIN                 : 163,
    OP_MAX                 : 164,

    OP_WITHIN              : 165,

    // crypto
    OP_RIPEMD160           : 166,
    OP_SHA1                : 167,
    OP_SHA256              : 168,
    OP_HASH160             : 169,
    OP_HASH256             : 170,
    OP_CODESEPARATOR       : 171,
    OP_CHECKSIG            : 172,
    OP_CHECKSIGVERIFY      : 173,
    OP_CHECKMULTISIG       : 174,
    OP_CHECKMULTISIGVERIFY : 175,

    // expansion
    OP_NOP1  : 176,
    OP_NOP2  : 177,
    OP_NOP3  : 178,
    OP_NOP4  : 179,
    OP_NOP5  : 180,
    OP_NOP6  : 181,
    OP_NOP7  : 182,
    OP_NOP8  : 183,
    OP_NOP9  : 184,
    OP_NOP10 : 185,

    // template matching params
    OP_PUBKEYHASH    : 253,
    OP_PUBKEY        : 254,
    OP_INVALIDOPCODE : 255
  };

  Opcode.reverseMap = [];

  for (var i in Opcode.map) {
    Opcode.reverseMap[Opcode.map[i]] = i;
  }
})();
(function () {
  var ops = Bitcoin.Opcode.map;

  var Script = Bitcoin.Script = function (data) {
    if (!data) {
      this.buffer = [];
    } else if ("string" == typeof data) {
      this.buffer = Crypto.util.base64ToBytes(data);
    } else if (Bitcoin.Util.isArray(data)) {
      this.buffer = data;
    } else if (data instanceof Script) {
      this.buffer = data.buffer;
    } else {
      throw new Error("Invalid script");
    }

    this.parse();
  };

  /**
   * Update the parsed script representation.
   *
   * Each Script object stores the script in two formats. First as a raw byte
   * array and second as an array of "chunks", such as opcodes and pieces of
   * data.
   *
   * This method updates the chunks cache. Normally this is called by the
   * constructor and you don't need to worry about it. However, if you change
   * the script buffer manually, you should update the chunks using this method.
   */
  Script.prototype.parse = function () {
    var self = this;

    this.chunks = [];

    // Cursor
    var i = 0;

    // Read n bytes and store result as a chunk
    function readChunk(n) {
      self.chunks.push(self.buffer.slice(i, i + n));
      i += n;
    };

    while (i < this.buffer.length) {
      var opcode = this.buffer[i++];
      if (opcode >= 0xF0) {
        // Two byte opcode
        opcode = (opcode << 8) | this.buffer[i++];
      }

      var len;
      if (opcode > 0 && opcode < ops.OP_PUSHDATA1) {
        // Read some bytes of data, opcode value is the length of data
        readChunk(opcode);
      } else if (opcode == ops.OP_PUSHDATA1) {
        len = this.buffer[i++];
        readChunk(len);
      } else if (opcode == ops.OP_PUSHDATA2) {
        len = (this.buffer[i++] << 8) | this.buffer[i++];
        readChunk(len);
      } else if (opcode == ops.OP_PUSHDATA4) {
        len = (this.buffer[i++] << 24) |
          (this.buffer[i++] << 16) |
          (this.buffer[i++] << 8) |
          this.buffer[i++];
        readChunk(len);
      } else {
        this.chunks.push(opcode);
      }
    }
  };

  /**
   * Compare the script to known templates of scriptPubKey.
   *
   * This method will compare the script to a small number of standard script
   * templates and return a string naming the detected type.
   *
   * Currently supported are:
   * Address:
   *   Paying to a Bitcoin address which is the hash of a pubkey.
   *   OP_DUP OP_HASH160 [pubKeyHash] OP_EQUALVERIFY OP_CHECKSIG
   *
   * Pubkey:
   *   Paying to a public key directly.
   *   [pubKey] OP_CHECKSIG
   * 
   * Strange:
   *   Any other script (no template matched).
   */
  Script.prototype.getOutType = function () {
    if (this.chunks[this.chunks.length-1] == ops.OP_CHECKMULTISIG &&
        this.chunks[this.chunks.length-2] <= ops.OP_1 + 2) {
      // Transfer to M-OF-N
      return 'Multisig';
    } else if (this.chunks.length == 5 &&
        this.chunks[0] == ops.OP_DUP &&
        this.chunks[1] == ops.OP_HASH160 &&
        this.chunks[3] == ops.OP_EQUALVERIFY &&
        this.chunks[4] == ops.OP_CHECKSIG) {
      // Transfer to Bitcoin address
      return 'Address';
    } else if (this.chunks.length == 3 &&
        this.chunks[0] == ops.OP_HASH160 &&
        this.chunks[2] == ops.OP_EQUAL) {
      return 'P2SH';
    } else if (this.chunks.length == 2 &&
        this.chunks[1] == ops.OP_CHECKSIG) {
      // Transfer to IP address
      return 'Pubkey';
    } else {
      return 'Strange';
    }
  }


  /**
   * Returns the affected address hash for this output.
   *
   * For standard transactions, this will return the hash of the pubKey that
   * can spend this output.
   *
   * In the future, for payToScriptHash outputs, this will return the
   * scriptHash. Note that non-standard and standard payToScriptHash transactions
   * look the same 
   *
   * This method is useful for indexing transactions.
   */
  Script.prototype.simpleOutHash = function ()
  {
    switch (this.getOutType()) {
    case 'Address':
      return this.chunks[2];
    case 'Pubkey':
      return Bitcoin.Util.sha256ripe160(this.chunks[0]);
    case 'P2SH':
      return this.chunks[1];
    default:
      throw new Error("Encountered non-standard scriptPubKey 6712"); //################ error here when trying to sign more than 1 input
    }
  };

  /**
   * Old name for Script#simpleOutHash.
   *
   * @deprecated
   */
  Script.prototype.simpleOutPubKeyHash = Script.prototype.simpleOutHash;

  /**
   * Compare the script to known templates of scriptSig.
   *
   * This method will compare the script to a small number of standard script
   * templates and return a string naming the detected type.
   *
   * WARNING: Use this method with caution. It merely represents a heuristic
   * based on common transaction formats. A non-standard transaction could
   * very easily match one of these templates by accident.
   *
   * Currently supported are:
   * Address:
   *   Paying to a Bitcoin address which is the hash of a pubkey.
   *   [sig] [pubKey]
   *
   * Pubkey:
   *   Paying to a public key directly.
   *   [sig]
   * 
   * Strange:
   *   Any other script (no template matched).
   */
  Script.prototype.getInType = function ()
  {
    if (this.chunks.length == 1 &&
        Bitcoin.Util.isArray(this.chunks[0])) {
      // Direct IP to IP transactions only have the signature in their scriptSig.
      // TODO: We could also check that the length of the data is correct.
      return 'Pubkey';
    } else if (this.chunks.length == 2 &&
               Bitcoin.Util.isArray(this.chunks[0]) &&
               Bitcoin.Util.isArray(this.chunks[1])) {
      return 'Address';
    } else {
      return 'Strange';
    }
  };

  /**
   * Returns the affected public key for this input.
   *
   * This currently only works with payToPubKeyHash transactions. It will also
   * work in the future for standard payToScriptHash transactions that use a
   * single public key.
   *
   * However for multi-key and other complex transactions, this will only return
   * one of the keys or raise an error. Therefore, it is recommended for indexing
   * purposes to use Script#simpleInHash or Script#simpleOutHash instead.
   *
   * @deprecated
   */
  Script.prototype.simpleInPubKey = function ()
  {
    switch (this.getInType()) {
    case 'Address':
      return this.chunks[1];
    case 'Pubkey':
      // TODO: Theoretically, we could recover the pubkey from the sig here.
      //       See https://bitcointalk.org/?topic=6430.0
      throw new Error("Script does not contain pubkey.");
    default:
      throw new Error("Encountered non-standard scriptSig");
    }
  };

  /**
   * Returns the affected address hash for this input.
   *
   * For standard transactions, this will return the hash of the pubKey that
   * can spend this output.
   *
   * In the future, for standard payToScriptHash inputs, this will return the
   * scriptHash.
   *
   * Note: This function provided for convenience. If you have the corresponding
   * scriptPubKey available, you are urged to use Script#simpleOutHash instead
   * as it is more reliable for non-standard payToScriptHash transactions.
   *
   * This method is useful for indexing transactions.
   */
  Script.prototype.simpleInHash = function ()
  {
    return Bitcoin.Util.sha256ripe160(this.simpleInPubKey());
  };

  /**
   * Old name for Script#simpleInHash.
   *
   * @deprecated
   */
  Script.prototype.simpleInPubKeyHash = Script.prototype.simpleInHash;

  /**
   * Add an op code to the script.
   */
  Script.prototype.writeOp = function (opcode)
  {
    this.buffer.push(opcode);
    this.chunks.push(opcode);
  };

  /**
   * Add a data chunk to the script.
   */
  Script.prototype.writeBytes = function (data)
  {
    if (data.length < ops.OP_PUSHDATA1) {
      this.buffer.push(data.length);
    } else if (data.length <= 0xff) {
      this.buffer.push(ops.OP_PUSHDATA1);
      this.buffer.push(data.length);
    } else if (data.length <= 0xffff) {
      this.buffer.push(ops.OP_PUSHDATA2);
      this.buffer.push(data.length & 0xff);
      this.buffer.push((data.length >>> 8) & 0xff);
    } else {
      this.buffer.push(ops.OP_PUSHDATA4);
      this.buffer.push(data.length & 0xff);
      this.buffer.push((data.length >>> 8) & 0xff);
      this.buffer.push((data.length >>> 16) & 0xff);
      this.buffer.push((data.length >>> 24) & 0xff);
    }
    this.buffer = this.buffer.concat(data);
    this.chunks.push(data);
  };

  /**
   * Create a standard payToPubKeyHash output.
   */
  Script.createOutputScript = function (address)
  {
    var script = new Bitcoin.Script();
    if (address.version == Bitcoin.Address.pubKeyHashVersion) {
      script.writeOp(ops.OP_DUP);
      script.writeOp(ops.OP_HASH160);
      script.writeBytes(address.hash);
      script.writeOp(ops.OP_EQUALVERIFY);
      script.writeOp(ops.OP_CHECKSIG);
    } else if (address.version == Bitcoin.Address.p2shVersion) {
      script.writeOp(ops.OP_HASH160);
      script.writeBytes(address.hash);
      script.writeOp(ops.OP_EQUAL);
    } else {
      throw "Unknown address version";
    }
    return script;
  };
  
  /**
   * Extract bitcoin addresses from an output script
   */
  Script.prototype.extractAddresses = function (addresses)
  { 
    switch (this.getOutType()) {
    case 'Address':
      addresses.push(new Bitcoin.Address(this.chunks[2]));
      return 1;
    case 'Pubkey':
      addresses.push(new Bitcoin.Address(Bitcoin.Util.sha256ripe160(this.chunks[0])));
      return 1;
    case 'P2SH':
      addresses.push(new Bitcoin.Address(this.chunks[1], Bitcoin.Address.p2shVersion));
      return 1;
    case 'Multisig':
      var pubKeys = [];
      var count = this.extractMultiSigPubKeys(pubKeys);
      for (var index = 0; index < pubKeys.length; ++index) {
        addresses.push(new Bitcoin.Address(Util.sha256ripe160(pubKeys[index])));
      }
      return count;
    default:
      throw new Error("Encountered non-standard scriptPubKey 6894");
    }
  };

  /**
   * Extract bitcoin addresses from a multi-sigscript
   */
  Script.prototype.extractMultiSigPubKeys = function (keys)
  { 
    if (this.chunks.length == 0 ||
        this.chunks[this.chunks.length - 1] != ops.OP_CHECKMULTISIG ||
        this.chunks[this.chunks.length - 2] > ops.OP_1 + 2) {
      throw 'not a multisig script';
    }
    for (var i = 1; i < this.chunks.length-2; ++i) {
      keys.push(this.chunks[i]);
    }
    return this.chunks[4] - ops.OP_1 + 1;
  };

  /**
   * Create an m-of-n script.
   * This can either be a multi-signature output or the
   * P2SH input script.
   */
  Script.createMultiSigScript = function (m, pubkeys)
  {
    var script = new Bitcoin.Script();

    script.writeOp(ops.OP_1 + m - 1);

    for (var i = 0; i < pubkeys.length; ++i) {
      script.writeBytes(pubkeys[i]);
    }
    
    script.writeOp(ops.OP_1 + pubkeys.length - 1);

    script.writeOp(ops.OP_CHECKMULTISIG);

    return script;
  };

  /**
   * Create a standard payToPubKeyHash input.
   */
  Script.createInputScript = function (signature, pubKey)
  {
    var script = new Script();
    script.writeBytes(signature);
    script.writeBytes(pubKey);
    return script;
  };

  Script.prototype.clone = function ()
  {
    return new Script(this.buffer);
  };
})();
(function () {
  var Script = Bitcoin.Script;

  var Transaction = Bitcoin.Transaction = function (doc) {
    this.version = 1;
    this.lock_time = 0;
    this.ins = [];
    this.outs = [];
    this.timestamp = null;
    this.block = null;

    if (doc) {
      if (doc.hash) this.hash = doc.hash;
      if (doc.version) this.version = doc.version;
      if (doc.lock_time) this.lock_time = doc.lock_time;
      if (doc.ins && doc.ins.length) {
        for (var i = 0; i < doc.ins.length; i++) {
          this.addInput(new TransactionIn(doc.ins[i]));
        }
      }
      if (doc.outs && doc.outs.length) {
        for (var i = 0; i < doc.outs.length; i++) {
          this.addOutput(new TransactionOut(doc.outs[i]));
        }
      }
      if (doc.timestamp) this.timestamp = doc.timestamp;
      if (doc.block) this.block = doc.block;
    }
  };

  /**
   * Turn transaction data into Transaction objects.
   *
   * Takes an array of plain JavaScript objects containing transaction data and
   * returns an array of Transaction objects.
   */
  Transaction.objectify = function (txs) {
    var objs = [];
    for (var i = 0; i < txs.length; i++) {
      objs.push(new Transaction(txs[i]));
    }
    return objs;
  };

  /**
   * Create a new txin.
   *
   * Can be called with an existing TransactionIn object to add it to the
   * transaction. Or it can be called with a Transaction object and an integer
   * output index, in which case a new TransactionIn object pointing to the
   * referenced output will be created.
   *
   * Note that this method does not sign the created input.
   */
  Transaction.prototype.addInput = function (tx, outIndex) {
    if (arguments[0] instanceof TransactionIn) {
      this.ins.push(arguments[0]);
    } else {
      this.ins.push(new TransactionIn({
        outpoint: {
          hash: tx.hash,
          index: outIndex
        },
        script: new Bitcoin.Script(),
        sequence: 4294967295
      }));
    }
  };

  Transaction.prototype.clearInputs = function (tx) {
    this.ins = [];
  };

  /**
   * Serialize this transaction.
   *
   * Returns the transaction as a byte array in the standard Bitcoin binary
   * format. This method is byte-perfect, i.e. the resulting byte array can
   * be hashed to get the transaction's standard Bitcoin hash.
   */
  Transaction.prototype.serialize = function ()
  {
    var buffer = [];
    buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(this.version)]).reverse());
    buffer = buffer.concat(Bitcoin.Util.numToVarInt(this.ins.length));
    for (var i = 0; i < this.ins.length; i++) {
      var txin = this.ins[i];
      buffer = buffer.concat(Crypto.util.base64ToBytes(txin.outpoint.hash));
      buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(txin.outpoint.index)]).reverse());
      var scriptBytes = txin.script.buffer;
      buffer = buffer.concat(Bitcoin.Util.numToVarInt(scriptBytes.length));
      buffer = buffer.concat(scriptBytes);
      buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(txin.sequence)]).reverse());
    }
    buffer = buffer.concat(Bitcoin.Util.numToVarInt(this.outs.length));
    for (var i = 0; i < this.outs.length; i++) {
      var txout = this.outs[i];
      buffer = buffer.concat(txout.value);
      var scriptBytes = txout.script.buffer;
      buffer = buffer.concat(Bitcoin.Util.numToVarInt(scriptBytes.length));
      buffer = buffer.concat(scriptBytes);
    }
    buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(this.lock_time)]).reverse());

    return buffer;
  };

  var OP_CODESEPARATOR = 171;

  var SIGHASH_ALL = 1;
  var SIGHASH_NONE = 2;
  var SIGHASH_SINGLE = 3;
  var SIGHASH_ANYONECANPAY = 80;

  /**
   * Hash transaction for signing a specific input.
   *
   * Bitcoin uses a different hash for each signed transaction input. This
   * method copies the transaction, makes the necessary changes based on the
   * hashType, serializes and finally hashes the result. This hash can then be
   * used to sign the transaction input in question.
   */
  Transaction.prototype.hashTransactionForSignature =
  function (connectedScript, inIndex, hashType)
  {
    var txTmp = this.clone();

    // In case concatenating two scripts ends up with two codeseparators,
    // or an extra one at the end, this prevents all those possible
    // incompatibilities.
    /*scriptCode = scriptCode.filter(function (val) {
     return val !== OP_CODESEPARATOR;
     });*/

    // Blank out other inputs' signatures
    for (var i = 0; i < txTmp.ins.length; i++) {
      txTmp.ins[i].script = new Script();
    }

    txTmp.ins[inIndex].script = connectedScript;

    // Blank out some of the outputs
    if ((hashType & 0x1f) == SIGHASH_NONE) {
      txTmp.outs = [];

      // Let the others update at will
      for (var i = 0; i < txTmp.ins.length; i++)
        if (i != inIndex)
          txTmp.ins[i].sequence = 0;
    } else if ((hashType & 0x1f) == SIGHASH_SINGLE) {
      // TODO: Implement
    }

    // Blank out other inputs completely, not recommended for open transactions
    if (hashType & SIGHASH_ANYONECANPAY) {
      txTmp.ins = [txTmp.ins[inIndex]];
    }

    var buffer = txTmp.serialize();

    buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(hashType)]).reverse());

    var hash1 = Crypto.SHA256(buffer, {asBytes: true});

    return Crypto.SHA256(hash1, {asBytes: true});
  };

  /**
   * Calculate and return the transaction's hash.
   */
  Transaction.prototype.getHash = function ()
  {
    var buffer = this.serialize();
    return Crypto.SHA256(Crypto.SHA256(buffer, {asBytes: true}), {asBytes: true});
  };

  /**
   * Create a copy of this transaction object.
   */
  Transaction.prototype.clone = function ()
  {
    var newTx = new Transaction();
    newTx.version = this.version;
    newTx.lock_time = this.lock_time;
    for (var i = 0; i < this.ins.length; i++) {
      var txin = this.ins[i].clone();
      newTx.addInput(txin);
    }
    for (var i = 0; i < this.outs.length; i++) {
      var txout = this.outs[i].clone();
      newTx.addOutput(txout);
    }
    return newTx;
  };

  /**
   * Analyze how this transaction affects a wallet.
   *
   * Returns an object with properties 'impact', 'type' and 'addr'.
   *
   * 'impact' is an object, see Transaction#calcImpact.
   * 
   * 'type' can be one of the following:
   * 
   * recv:
   *   This is an incoming transaction, the wallet received money.
   *   'addr' contains the first address in the wallet that receives money
   *   from this transaction.
   *
   * self:
   *   This is an internal transaction, money was sent within the wallet.
   *   'addr' is undefined.
   *
   * sent:
   *   This is an outgoing transaction, money was sent out from the wallet.
   *   'addr' contains the first external address, i.e. the recipient.
   *
   * other:
   *   This method was unable to detect what the transaction does. Either it
   */
  Transaction.prototype.analyze = function (wallet) {
    if (!(wallet instanceof Bitcoin.Wallet)) return null;

    var allFromMe = true,
    allToMe = true,
    firstRecvHash = null,
    firstMeRecvHash = null,
    firstSendHash = null;

    for (var i = this.outs.length-1; i >= 0; i--) {
      var txout = this.outs[i];
      var hash = txout.script.simpleOutPubKeyHash();
      if (!wallet.hasHash(hash)) {
        allToMe = false;
      } else {
        firstMeRecvHash = hash;
      }
      firstRecvHash = hash;
    }
    for (var i = this.ins.length-1; i >= 0; i--) {
      var txin = this.ins[i];
      firstSendHash = txin.script.simpleInPubKeyHash();
      if (!wallet.hasHash(firstSendHash)) {
        allFromMe = false;
        break;
      }
    }

    var impact = this.calcImpact(wallet);

    var analysis = {};

    analysis.impact = impact;

    if (impact.sign > 0 && impact.value.compareTo(BigInteger.ZERO) > 0) {
      analysis.type = 'recv';
      analysis.addr = new Bitcoin.Address(firstMeRecvHash);
    } else if (allFromMe && allToMe) {
      analysis.type = 'self';
    } else if (allFromMe) {
      analysis.type = 'sent';
      // TODO: Right now, firstRecvHash is the first output, which - if the
      //       transaction was not generated by this library could be the
      //       change address.
      analysis.addr = new Bitcoin.Address(firstRecvHash);
    } else  {
      analysis.type = "other";
    }

    return analysis;
  };

  /**
   * Get a human-readable version of the data returned by Transaction#analyze.
   *
   * This is merely a convenience function. Clients should consider implementing
   * this themselves based on their UI, I18N, etc.
   */
  Transaction.prototype.getDescription = function (wallet) {
    var analysis = this.analyze(wallet);

    if (!analysis) return "";

    switch (analysis.type) {
    case 'recv':
      return "Received with "+analysis.addr;
      break;

    case 'sent':
      return "Payment to "+analysis.addr;
      break;

    case 'self':
      return "Payment to yourself";
      break;

    case 'other':
    default:
      return "";
    }
  };

  /**
   * Get the total amount of a transaction's outputs.
   */
  Transaction.prototype.getTotalOutValue = function () {
    var totalValue = BigInteger.ZERO;
    for (var j = 0; j < this.outs.length; j++) {
      var txout = this.outs[j];
      totalValue = totalValue.add(Bitcoin.Util.valueToBigInt(txout.value));
    }
    return totalValue;
  };

  /**
   * Old name for Transaction#getTotalOutValue.
   *
   * @deprecated
   */
  Transaction.prototype.getTotalValue = Transaction.prototype.getTotalOutValue;

  /**
   * Calculates the impact a transaction has on this wallet.
   *
   * Based on the its public keys, the wallet will calculate the
   * credit or debit of this transaction.
   *
   * It will return an object with two properties:
   *  - sign: 1 or -1 depending on sign of the calculated impact.
   *  - value: amount of calculated impact
   *
   * @returns Object Impact on wallet
   */
  Transaction.prototype.calcImpact = function (wallet) {
    if (!(wallet instanceof Bitcoin.Wallet)) return BigInteger.ZERO;

    // Calculate credit to us from all outputs
    var valueOut = BigInteger.ZERO;
    for (var j = 0; j < this.outs.length; j++) {
      var txout = this.outs[j];
      var hash = Crypto.util.bytesToBase64(txout.script.simpleOutPubKeyHash());
      if (wallet.hasHash(hash)) {
        valueOut = valueOut.add(Bitcoin.Util.valueToBigInt(txout.value));
      }
    }

    // Calculate debit to us from all ins
    var valueIn = BigInteger.ZERO;
    for (var j = 0; j < this.ins.length; j++) {
      var txin = this.ins[j];
      var hash = Crypto.util.bytesToBase64(txin.script.simpleInPubKeyHash());
      if (wallet.hasHash(hash)) {
        var fromTx = wallet.txIndex[txin.outpoint.hash];
        if (fromTx) {
          valueIn = valueIn.add(Bitcoin.Util.valueToBigInt(fromTx.outs[txin.outpoint.index].value));
        }
      }
    }
    if (valueOut.compareTo(valueIn) >= 0) {
      return {
        sign: 1,
        value: valueOut.subtract(valueIn)
      };
    } else {
      return {
        sign: -1,
        value: valueIn.subtract(valueOut)
      };
    }
  };

  var TransactionIn = Bitcoin.TransactionIn = function (data)
  {
    this.outpoint = data.outpoint;
    if (data.script instanceof Script) {
      this.script = data.script;
    } else {
      this.script = new Script(data.script);
    }
    this.sequence = data.sequence;
  };

  TransactionIn.prototype.clone = function ()
  {
    var newTxin = new TransactionIn({
      outpoint: {
        hash: this.outpoint.hash,
        index: this.outpoint.index
      },
      script: this.script.clone(),
      sequence: this.sequence
    });
    return newTxin;
  };

  var TransactionOut = Bitcoin.TransactionOut = function (data)
  {
    if (data.script instanceof Script) {
      this.script = data.script;
    } else {
      this.script = new Script(data.script);
    }

    if (Bitcoin.Util.isArray(data.value)) {
      this.value = data.value;
    } else if ("string" == typeof data.value) {
      var valueHex = (new BigInteger(data.value, 10)).toString(16);
      while (valueHex.length < 16) valueHex = "0" + valueHex;
      this.value = Crypto.util.hexToBytes(valueHex);
    }
  };

  TransactionOut.prototype.clone = function ()
  {
    var newTxout = new TransactionOut({
      script: this.script.clone(),
      value: this.value.slice(0)
    });
    return newTxout;
  };


  //
  // Utility functions for parsing
  //
  function uint(f, size) {
    if (f.length < size)
      return 0;
    var bytes = f.slice(0, size);
    var pos = 1;
    var n = 0;
    for (var i = 0; i < size; i++) {
      var b = f.shift();
      n += b * pos;
      pos *= 256;
    }
    return size <= 4 ? n : bytes;
  }

  function u8(f)  { return uint(f,1); }
  function u16(f) { return uint(f,2); }
  function u32(f) { return uint(f,4); }
  function u64(f) { return uint(f,8); }

  function errv(val) {
    return (val instanceof BigInteger || val > 0xffff);
  }

  function readBuffer(f, size) {
    var res = f.slice(0, size);
    for (var i = 0; i < size; i++) f.shift();
    return res;
  }

  function readString(f) {
    var len = readVarInt(f);
    if (errv(len)) return [];
    return readBuffer(f, len);
  }

  function readVarInt(f) {
    var t = u8(f);
    if (t == 0xfd) return u16(f); else
    if (t == 0xfe) return u32(f); else
    if (t == 0xff) return u64(f); else
    return t;
  }

  Transaction.deserialize = function(bytes) {
    var sendTx = new Bitcoin.Transaction();

    var f = bytes.slice(0);  // creates a copy.
    var tx_ver = u32(f);
    if (tx_ver != 1) {
        return null;
    }
    var vin_sz = readVarInt(f);
    if (errv(vin_sz))
        return null;

    for (var i = 0; i < vin_sz; i++) {
        var op = readBuffer(f, 32);
        var n = u32(f);
        var script = readString(f);
        var seq = u32(f);
        var txin = new Bitcoin.TransactionIn({
            outpoint: {
                hash: Crypto.util.bytesToBase64(op),
                index: n
            },
            script: new Bitcoin.Script(script),
            sequence: seq
        });
        sendTx.addInput(txin);
    }

    var vout_sz = readVarInt(f);

    if (errv(vout_sz))
        return null;

    for (var i = 0; i < vout_sz; i++) {
        var value = u64(f);
        var script = readString(f);

        var txout = new Bitcoin.TransactionOut({
            value: value,
            script: new Bitcoin.Script(script)
        });

        sendTx.addOutput(txout);
    }
    var lock_time = u32(f);
    sendTx.lock_time = lock_time;
    return sendTx;
  };

  /*
   * Cracks open the transaction and verifies if the signature matches.
   */
  Transaction.prototype.verifySignatures = function(inputTransaction) {
/*
 *
 * IMPLEMENT ME
 */
    for (var index = 0; index < this.ins.lengths; ++index) {
      var input = this.ins[index];
      var inputScript = input.script;
      var scriptType = inputScript.getOutType();

      var txHashForSigning = this.hashTransactionForSignature(inputScript, index, SIGHASH_ALL);
    }
// */
    return false;
  };

  // Enumerate all the inputs, and find any which require a key
  // which matches the input key.
  //
  // Returns the number of inputs signed.
  Transaction.prototype.signWithKey = function(key) {
    var signatureCount = 0;
  
    var keyHash = key.getPubKeyHash();
    for (var index = 0; index < this.ins.length; ++index) {
      var input = this.ins[index];
      var inputScript = input.script;
  
      if (inputScript.simpleOutHash().compare(keyHash)) {
        var hashType = 1;  // SIGHASH_ALL
        var hash = this.hashTransactionForSignature(inputScript, index, hashType);
        var signature = key.sign(hash);
        signature.push(parseInt(hashType, 10));
        var pubKey = key.getPub();
        var script = new Bitcoin.Script();
        script.writeBytes(signature);
        script.writeBytes(pubKey);
        this.ins[index].script = script;
        signatureCount++;
      }
    }
    return signatureCount;
  };

  // Sign a transaction for a P2SH multi-signature input.
  //
  // Enumerates all the inputs, and find any which need our signature.
  // This function does not require that all signatures are applied at the
  // same time.  You can sign it once, then call it again later to sign
  // again.  When this happens, we leave the scriptSig padded with OP_0's
  // where the missing signatures would go.  This allows to us to create
  // a valid, parseable transaction that can be passed around in this
  // intermediate, partially signed state.
  //
  // Returns the number of signnatures applied in this pass (kind of meaningless)
  Transaction.prototype.signWithMultiSigScript = function(keyArray, redeemScriptBytes) {
    var hashType = 1;  // SIGHASH_ALL
    var signatureCount = 0;
  
    // First figure out how many signatures we need.
    var redeemScript = new Bitcoin.Script(redeemScriptBytes);
    var numSigsRequired = redeemScript.chunks[0] - Bitcoin.Opcode.map.OP_1 + 1;
    if (numSigsRequired < 0 || numSigsRequired > 3) {
      throw "Can't determine required number of signatures";
    }
    var redeemScriptHash = Bitcoin.Util.sha256ripe160(redeemScriptBytes);
  
    var self = this;
    this.ins.forEach(function(input, inputIndex) {
      var inputScript = input.script;
  
      // This reedem script applies under two cases:
      //   a) The input has no signatures yet, is a P2SH input script, and hash a hash matching this redeemscript.
      //   b) The input some signatures already, but needs more.
  
      if (inputScript.getOutType() == 'P2SH' &&
          inputScript.simpleOutHash().compare(redeemScriptHash)) {
        // This is a matching P2SH input.  Create a template Script with
        // 0's as placeholders for the signatures.
  
        var script = new Bitcoin.Script();
        script.writeOp(Bitcoin.Opcode.map.OP_0);  // BIP11 requires this leading OP_0.
        for (var index = 0; index < numSigsRequired; ++index) {
          script.writeOp(Bitcoin.Opcode.map.OP_0);  // A placeholder for each sig
        }
        script.writeBytes(redeemScriptBytes);  // The redeemScript itself.
        inputScript = self.ins[inputIndex].script = script;
      }
  
      // Check if the input script looks like a partially signed template.
      // If so, apply as many signatures as we can.
      if ((inputScript.chunks.length == numSigsRequired + 2) &&
          (inputScript.chunks[0] == Bitcoin.Opcode.map.OP_0) &&
          (inputScript.chunks[numSigsRequired+1].compare(redeemScriptBytes))) {
        var keyIndex = 0;  // keys we've used so far for this input.
  
        var hashToSign = self.hashTransactionForSignature(redeemScript, inputIndex, hashType);
  
        // Create a new script, insert the leading OP_0.
        var script = new Bitcoin.Script();
        script.writeOp(Bitcoin.Opcode.map.OP_0);
  
        // For the rest of the sigs, either copy or insert a new one.
        for (var index = 1; index < 1 + numSigsRequired; ++index) {
          if (inputScript.chunks[index] != 0) {  // Already signed case
            script.writeBytes(inputScript.chunks[index]);
          } else {
            var signed = false;
            while (!signed && keyIndex < keyArray.length) {
              var key = keyArray[keyIndex++];  // increment keys tried
              var signature = key.sign(hashToSign);
              signature.push(parseInt(hashType, 10));
  
              // Verify that this signature hasn't already been applied.
              var isDuplicateSignature = false;
              for (var index2 = 1; index2 < 1 + numSigsRequired; ++index2) {
                if (signature.compare(inputScript.chunks[index2])) {
                  isDuplicateSignature = true;
                  break;
                }
              }
              if (isDuplicateSignature) {
                continue;  // try another key
              }
              script.writeBytes(signature);  // Apply the signature
              signatureCount++;
              signed = true;
            }
            if (!signed) {
              // We don't have any more keys to sign with!
              // Write another placeholder.
              script.writeOp(Bitcoin.Opcode.map.OP_0);
            }
          }
        }
        // Finally, record the redeemScript itself and we're done.
        script.writeBytes(redeemScriptBytes);
        self.ins[inputIndex].script = script;
      }
    });
    return signatureCount;
  }

  /**
   * Create a new txout.
   *
   * Can be called with an existing TransactionOut object to add it to the
   * transaction. Or it can be called with an Address object and a BigInteger
   * for the amount, in which case a new TransactionOut object with those
   * values will be created.
   */
  Transaction.prototype.addOutput = function (address, value) {
    if (arguments[0] instanceof Bitcoin.TransactionOut) {
      this.outs.push(arguments[0]);
    } else {
      if (value instanceof BigInteger) {
        value = value.toByteArrayUnsigned().reverse();
        while (value.length < 8) value.push(0);
      } else if (Bitcoin.Util.isArray(value)) {
        // Nothing to do
      } else if ( typeof(value) == 'number') {
        value = BigInteger.valueOf(value);
        value = value.toByteArrayUnsigned().reverse();
        while (value.length < 8) value.push(0);
      }
  
      this.outs.push(new Bitcoin.TransactionOut({
        value: value,
        script: Bitcoin.Script.createOutputScript(address)
      }));
    }
  };

  Transaction.prototype.clearOutputs = function (tx) {
    this.outs = [];
  };
})();
var TransactionDatabase = function () {
  this.txs = [];
  this.txIndex = {};
};

EventEmitter.augment(TransactionDatabase.prototype);

TransactionDatabase.prototype.addTransaction = function (tx) {
  this.addTransactionNoUpdate(tx);
  $(this).trigger('update');
};

TransactionDatabase.prototype.addTransactionNoUpdate = function (tx) {
  // Return if transaction is already known
  if (this.txIndex[tx.hash]) {
    return;
  }

  this.txs.push(new Bitcoin.Transaction(tx));
  this.txIndex[tx.hash] = tx;
};

TransactionDatabase.prototype.removeTransaction = function (hash) {
  this.removeTransactionNoUpdate(hash);
  $(this).trigger('update');
};

TransactionDatabase.prototype.removeTransactionNoUpdate = function (hash) {
  var tx = this.txIndex[hash];

  if (!tx) {
    // If the tx is not in the index, we don't actually waste our
    // time looping through the array.
    return;
  }

  for (var i = 0, l = this.txs.length; i < l; i++) {
    if (this.txs[i].hash == hash) {
      this.txs.splice(i, 1);
      break;
    }
  }

  delete this.txIndex[hash];
};

TransactionDatabase.prototype.loadTransactions = function (txs) {
  for (var i = 0; i < txs.length; i++) {
    this.addTransactionNoUpdate(txs[i]);
  }
  $(this).trigger('update');
};

TransactionDatabase.prototype.getTransactions = function () {
  return this.txs;
};

TransactionDatabase.prototype.clear = function () {
  this.txs = [];
  this.txIndex = {};
  $(this).trigger('update');
};


var MAINNET_PUBLIC = 0x0488b21e;

var MAINNET_PRIVATE = 0x0488ade4;

var TESTNET_PUBLIC = 0x043587cf;

var TESTNET_PRIVATE = 0x04358394;



var BIP32 = function(bytes) {

    // decode base58

    if( typeof bytes === "string" ) {

        var decoded = Bitcoin.Base58.decode(bytes);

        if( decoded.length != 82 ) throw new Exception("Not enough data");

        var checksum = decoded.slice(78, 82);

        bytes = decoded.slice(0, 78);



        var hash = Crypto.SHA256( Crypto.SHA256( bytes, { asBytes: true } ), { asBytes: true } );



        if( hash[0] != checksum[0] || hash[1] != checksum[1] || hash[2] != checksum[2] || hash[3] != checksum[3] ) {

            throw new Exception("Invalid checksum");

        }

    }



    if( bytes !== undefined ) 

        this.init_from_bytes(bytes);

}



BIP32.prototype.init_from_bytes = function(bytes) {

    // Both pub and private extended keys are 78 bytes

    if( bytes.length != 78 ) throw new Exception("not enough data");



    this.version            = u32(bytes.slice(0, 4));

    this.depth              = u8 (bytes.slice(4, 5));

    this.parent_fingerprint = bytes.slice(5, 9);

    this.child_index        = u32(bytes.slice(9, 13));

    this.chain_code         = bytes.slice(13, 45);

    

    var key_bytes = bytes.slice(45, 78);



    if( (this.version == MAINNET_PRIVATE || this.version == TESTNET_PRIVATE) && key_bytes[0] == 0 ) {

        this.eckey = new Bitcoin.ECKey(key_bytes.slice(1, 33));

        this.eckey.setCompressed(true);

        this.has_private_key = true;

    } else if( (this.version == MAINNET_PUBLIC || this.version == TESTNET_PUBLIC) && (key_bytes[0] == 0x02 || key_bytes[0] == 0x03) ) {

        this.eckey = new Bitcoin.ECKey("0");

        this.eckey.pubPoint = decompress_pubkey(key_bytes);

        this.eckey.setCompressed(true);

        this.has_private_key = false;

    } else {

        throw new Exception("Invalid key");

    }



    this.build_extended_public_key();

    this.build_extended_private_key();

}



BIP32.prototype.build_extended_public_key = function() {

    this.extended_public_key = [];



    var v = MAINNET_PUBLIC;

    if( this.version == TESTNET_PUBLIC || this.version == TESTNET_PRIVATE ) {

        v = TESTNET_PUBLIC;

    }



    // Version

    this.extended_public_key.push(v >> 24);

    this.extended_public_key.push((v >> 16) & 0xff);

    this.extended_public_key.push((v >> 8) & 0xff);

    this.extended_public_key.push(v & 0xff);



    // Depth

    this.extended_public_key.push(this.depth);



    // Parent fingerprint

    this.extended_public_key = this.extended_public_key.concat(this.parent_fingerprint);



    // Child index

    this.extended_public_key.push(this.child_index >>> 24);

    this.extended_public_key.push((this.child_index >>> 16) & 0xff);

    this.extended_public_key.push((this.child_index >>> 8) & 0xff);

    this.extended_public_key.push(this.child_index & 0xff);



    // Chain code

    this.extended_public_key = this.extended_public_key.concat(this.chain_code);



    // Public key

    this.extended_public_key = this.extended_public_key.concat(this.eckey.getPub());

}



BIP32.prototype.extended_public_key_string = function(format) {

    if( format === undefined || format === "base58" ) {

        var hash = Crypto.SHA256( Crypto.SHA256( this.extended_public_key, { asBytes: true } ), { asBytes: true } );

        var checksum = hash.slice(0, 4);

        var data = this.extended_public_key.concat(checksum);

        return Bitcoin.Base58.encode(data);

    } else if( format === "hex" ) {

        return Crypto.util.bytesToHex(this.extended_public_key);

    } else {

        throw new Error("bad format");

    }

}



BIP32.prototype.build_extended_private_key = function() {

    if( !this.has_private_key ) return;

    this.extended_private_key = [];



    var v = MAINNET_PRIVATE;

    if( this.version == TESTNET_PUBLIC || this.version == TESTNET_PRIVATE ) {

        v = TESTNET_PRIVATE;

    }



    // Version

    this.extended_private_key.push(v >> 24);

    this.extended_private_key.push((v >> 16) & 0xff);

    this.extended_private_key.push((v >> 8) & 0xff);

    this.extended_private_key.push(v & 0xff);



    // Depth

    this.extended_private_key.push(this.depth);



    // Parent fingerprint

    this.extended_private_key = this.extended_private_key.concat(this.parent_fingerprint);



    // Child index

    this.extended_private_key.push(this.child_index >>> 24);

    this.extended_private_key.push((this.child_index >>> 16) & 0xff);

    this.extended_private_key.push((this.child_index >>> 8) & 0xff);

    this.extended_private_key.push(this.child_index & 0xff);



    // Chain code

    this.extended_private_key = this.extended_private_key.concat(this.chain_code);



    // Private key

    this.extended_private_key.push(0);

    this.extended_private_key = this.extended_private_key.concat(this.eckey.priv.toByteArrayUnsigned());

}



BIP32.prototype.extended_private_key_string = function(format) {

    if( format === undefined || format === "base58" ) {

        var hash = Crypto.SHA256( Crypto.SHA256( this.extended_private_key, { asBytes: true } ), { asBytes: true } );

        var checksum = hash.slice(0, 4);

        var data = this.extended_private_key.concat(checksum);

        return Bitcoin.Base58.encode(data);

    } else if( format === "hex" ) {

        return Crypto.util.bytesToHex(this.extended_private_key);

    } else {

        throw new Error("bad format");

    }

}





BIP32.prototype.derive = function(path) {

    var e = path.split('/');



    var bip32 = this;

    for( var i in e ) {

        if (!e.hasOwnProperty(i)) continue;

        var c = e[i];



        if( i == 0 ) {

            if( c != 'm' ) throw "invalid path";

            continue;

        }



        var use_private = (c.length > 1) && (c[c.length-1] == '\'');

        var child_index = parseInt(use_private ? c.slice(0, c.length - 1) : c) & 0x7fffffff;



        if( use_private )

            child_index += 0x80000000;



        bip32 = bip32.derive_child(child_index);

    }



    return bip32;

}



BIP32.prototype.derive_child = function(i) {

    var ib = [];

    ib.push( (i >> 24) & 0xff );

    ib.push( (i >> 16) & 0xff );

    ib.push( (i >>  8) & 0xff );

    ib.push( i & 0xff );



    var use_private = (i & 0x80000000) != 0;

    var ecparams = getSECCurveByName("secp256k1");



    if( use_private && (!this.has_private_key || (this.version != MAINNET_PRIVATE && this.version != TESTNET_PRIVATE)) ) throw new Error("Cannot do private key derivation without private key");



    var ret = null;

    if( this.has_private_key ) {

        // Private-key derivation is the same whether we have private key or not.

        var data = null;



        if( use_private ) {

            data = [0].concat(this.eckey.priv.toByteArrayUnsigned()).concat(ib);

        } else {

            data = this.eckey.getPub().concat(ib);

        }



        var j = new jsSHA(Crypto.util.bytesToHex(data), 'HEX');   

        var hash = j.getHMAC(Crypto.util.bytesToHex(this.chain_code), "HEX", "SHA-512", "HEX");

        var il = new BigInteger(hash.slice(0, 64), 16);

        var ir = Crypto.util.hexToBytes(hash.slice(64, 128));



        // ki = IL + kpar (mod n).

        var curve = ecparams.getCurve();

        var k = il.add(this.eckey.priv).mod(ecparams.getN());



        ret = new BIP32();

        ret.chain_code  = ir;



        ret.eckey = new Bitcoin.ECKey(k.toByteArrayUnsigned());

        ret.has_private_key = true;



    } else {

        // Public-key derivation is the same whether we have private key or not.

        var data = this.eckey.getPub().concat(ib);

        var j = new jsSHA(Crypto.util.bytesToHex(data), 'HEX');   

        var hash = j.getHMAC(Crypto.util.bytesToHex(this.chain_code), "HEX", "SHA-512", "HEX");

        var il = new BigInteger(hash.slice(0, 64), 16);

        var ir = Crypto.util.hexToBytes(hash.slice(64, 128));



        // Ki = (IL + kpar)*G = IL*G + Kpar

        var k = ecparams.getG().multiply(il).add(this.eckey.getPubPoint());



        ret = new BIP32();

        ret.chain_code  = ir;



        ret.eckey = new Bitcoin.ECKey("0");

        ret.eckey.setPub(k.getEncoded(true));

        ret.has_private_key = false;

    }



    ret.child_index = i;

    ret.parent_fingerprint = this.eckey.getPubKeyHash().slice(0,4);

    ret.version = this.version;

    ret.depth   = this.depth + 1;



    ret.eckey.setCompressed(true);



    ret.build_extended_public_key();

    ret.build_extended_private_key();



    return ret;

}





function uint(f, size) {

    if (f.length < size)

        throw new Error("not enough data");

    var n = 0;

    for (var i = 0; i < size; i++) {

        n *= 256;

        n += f[i];

    }

    return n;

}



function u8(f)  { return uint(f,1); }

function u16(f) { return uint(f,2); }

function u32(f) { return uint(f,4); }

function u64(f) { return uint(f,8); }



function decompress_pubkey(key_bytes) {

    var ecparams = getSECCurveByName("secp256k1");

    return ecparams.getCurve().decodePointHex(Crypto.util.bytesToHex(key_bytes));

}

(function() {

  /*

   * BitGo additions for globally selecting network type

   */

  Bitcoin.setNetwork = function(network) {

    if (network == 'prod') {

      Bitcoin.Address.pubKeyHashVersion = 0x00;

      Bitcoin.Address.p2shVersion    = 0x5;

      Bitcoin.ECKey.privateKeyPrefix = 0x80;

    } else {

      // test network

      Bitcoin.Address.pubKeyHashVersion = 0x6f;

      Bitcoin.Address.p2shVersion    = 0xc4;

      Bitcoin.ECKey.privateKeyPrefix = 0xef;

    }

  }

  Bitcoin.setNetwork('prod');

  

  // WARNING:  It's bad form to set a function on the global array prototype here.

  Array.prototype.compare = function (array) {

    // if the other array is a falsy value, return

    if (!array)

      return false;

  

    // compare lengths - can save a lot of time

    if (this.length != array.length)

      return false;

  

    for (var i = 0; i < this.length; i++) {

      // Check if we have nested arrays

      if (this[i] instanceof Array && array[i] instanceof Array) {

        // recurse into the nested arrays

        if (!this[i].compare(array[i]))

          return false;

        }

        else if (this[i] != array[i]) {

          // Warning - two different object instances will never be equal: {x:20} != {x:20}

          return false;

        }

      }

    return true;

  }

  

  // So we can load into node.

  if (typeof(module) == 'object') {

    module.exports = function(network) {

      sjcl = require('sjcl');



      // The SJCL guys screwed up how they export modules; so two imports

      // both need to separately initialize the randomness.

      var crypto = require('crypto');

      var buf = Bitcoin.Util.hexToBytes(crypto.randomBytes(1024/8).toString('hex'));

      sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes");



      Bitcoin.setNetwork(network);

      return Bitcoin;

    }

  }

})();

