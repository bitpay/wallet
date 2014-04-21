node-cryptojs-aes
=================

**node-cryptojs-aes** is a minimalist port of cryptojs javascript library to node.js, that supports AES symmetric key cryptography.

Unlike node.js native crypto library, **node-cryptojs-aes** removes openssl dependency.

It is built upon award winning browser side javascript library CryptoJS. currently, it has been updated to be compatible with CryptoJS version 3.1. 

**node-cryptojs-aes** doesn't make any modification to original cryptojs library, the syntax remains the same in accordance with [CryptoJS documentation](http://code.google.com/p/crypto-js/). 

**node-cryptojs-aes** doesn't rely on any external library, such as native openssl libary or any external node.js modules. As a node.js module, it can simply be installed through npm package management system. There is no configuration needed also.

**node-cryptojs-aes** maximises node.js design spirit. Browser side and server side are running identical javascript cryptography codebase. It allows coder to migrate any browser side logic to server or vice versa without any modification. The message passing between server side and client side has been drastically simplified. The encrypted JSON data is passed between client side and server side without any additional parsing or encoding effort made on both side.

**node-cryptojs-aes** works great on **frontend data masking and unmasking**. Client will do the heavy lifting to decipher and reveal the masked data, reduce server load and processing time.

## Features

  * **Self Contained** It doesn't rely on any external dependency.
  * **Server Side Cryptography** It is the only up and running server side javascript cryptography library so far. 
  * **Cross Platform** It is working across all node.js supported platform.
  * **Code Base** Browser and Server share same codebase.
  * **AES symmetric key cryptography** It supports AES-128, AES-192 and AES-256 Encryption.
  * **Encoding** It supports Base64 encoding, Hexadecimal, Utf-8 and binary.
  * **Cipher Input** The key or iv(initialization vector) can be passed in as parameter of encryption function, or single passphrase can be passed in as parameter.

## Sample Usage

This is a complete example where server encrypts data, browser requests encrypted data and passphrase, then processes decipher subsequently.

To best demostrate the library structure, and separate client side and server side, the server is going to be hosted on `localhost:3000`, whereas client can be run on any
standard `http server`. Communication is carried out through [JSONP](http://api.jquery.com/jquery.getjson/). I real world, however, application can be integrated into Express sinatra pattern.

Browser side is powered by [Bootstrap](http://getbootstrap.com/) Cover Template.

### Server Side
---
This part of code snippets are located in examples/server/server.js. Test out in command line:
```
node server.js
```
#### Encryption logic
The logic on node.js server encryption logic consists of two parts.

##### Part 1
Right off the bat, it generates random passphrase using the native `node.js crypto` library method.

```javascript
//import crypto module to generate random binary data
var crypto = require('crypto');

// generate random passphrase binary data
var r_pass = crypto.randomBytes(128);

// convert passphrase to base64 format
var r_pass_base64 = r_pass.toString("base64");

console.log("passphrase base64 format: ");
console.log(r_pass_base64);
```
##### Part 2
Then, it performs data encryption

```javascript
// import node-cryptojs-aes modules to encrypt or decrypt data
var node_cryptojs = require('node-cryptojs-aes');

// node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;

// custom json serialization format
var JsonFormatter = node_cryptojs.JsonFormatter;

// message to cipher
var message = "I love maccas!";

// encrypt plain text with passphrase and custom json serialization format, return CipherParams object
// r_pass_base64 is the passphrase generated from first stage
// message is the original plain text  

var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });

// convert CipherParams object to json string for transmission
var encrypted_json_str = encrypted.toString();

console.log("serialized CipherParams object: ");
console.log(encrypted_json_str);
```

JsonFormatter is a custom json serialization implementation, you might create your prefered json serialization to fit into your own structure. According to [CryptoJS documentation](http://code.google.com/p/crypto-js/), the code snippets of JsonFormatter shipped with **node-cryptojs-aes** is as follows.

```javascript
//create custom json serialization format
var JsonFormatter = {
	stringify: function (cipherParams) {
		// create json object with ciphertext
		var jsonObj = {
			ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
		};
		
		// optionally add iv and salt
		if (cipherParams.iv) {
			jsonObj.iv = cipherParams.iv.toString();
		}
		
		if (cipherParams.salt) {
			jsonObj.s = cipherParams.salt.toString();
		}

		// stringify json object
		return JSON.stringify(jsonObj)
	},

	parse: function (jsonStr) {
		// parse json string
		var jsonObj = JSON.parse(jsonStr);
		
		// extract ciphertext from json object, and create cipher params object
		var cipherParams = CryptoJS.lib.CipherParams.create({
			ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
		});
		
		// optionally extract iv and salt
		if (jsonObj.iv) {
			cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
		}
            
		if (jsonObj.s) {
			cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
		}
		
		return cipherParams;
	}
};
```
The serialized cipherParams object defaults OPENSSL-compatible format. It contains 3 properties, a IV, a salt and a cipher text encrypted by AES.
```javascript
{
  "ct":"gpiVs3D4dqUI/G8F+8Elgg==",  //result of encryption performed on plaintext
  "iv":"008fffd119971f34dbd29e80a823cef2", //IV
  "s":"43e2badf9eb689fd"  //salt
}
```

#### Express3 integration
If running express to serve http request on node.js, the response can be

```javascript
// encryption logic here

//express 3 application
var express = require('express');
var app = express();

// browser request serialized cipherParams object in path /crypto/encrypted, with JSONP support
app.get('/crypto/encrypted', function(request, response) {

	//JSONP allow cross domain AJAX
    response.jsonp({
        encrypted : encrypted_json_str
    });

});

// browser request passphrase in path /crypto/passphrase, with JSONP support
app.get('/crypto/passphrase', function(request, response) {

	//JSONP allow cross domain AJAX
    response.jsonp({
        passphrase : r_pass_base64
    });

});

app.listen(3000);
```

### Browser Side(Frontend Data Masking)
---
This part of code snippets are located in examples/browser.

On browser side, The encrypted JSON string(masked data) should be embedded in a hidden tag when first time construct the page.

For demostration and simplicity, in our example, the encrypted JSON string is added to a hidden tag through AJAX.  

```javascript
// retrieve encrypted json string when loading page
// define server cipherParams JSONP path
var encrypted_url = "http://localhost:3000/crypto/encrypted?callback=?";
	
// JSONP AJAX call to node.js server running on localhost:3000
$.getJSON(encrypted_url, function(data){

	// retrieve encrypted json string 
	var encrypted_json_str = data.encrypted;

	console.log("encrypted json string: ");
	console.log(encrypted_json_str);
	    
	// store masked data into a div tag
	$("#data_store").text(encrypted_json_str);

});
```
[Data Masking](http://en.wikipedia.org/wiki/Data_masking)
> The main reason for applying masking to a data field is to protect data that is classified as personal identifiable data, personal sensitive data or commercially sensitive data. 

Hacker and expert won't be able to access real messages through frontend code inspecting approach, such as `Firebug` or `Chrome developer tools`.
Data masking applied here protects sensitive data(such as credit card number) from being viewed by frontend code analysis without authorization.

It is worth noting that this approach comes into handy if there are requirements **large amount** of sensitive data need to be processed and stored in the client side at page construction time.
Once passphrase is passed from server, client will do the heavy lifting to decipher and reveal the masked data, **reduce server load and processing time**.

On the other hand, AJAX request will consume bandwidth when passing large amount sensitive data in real time, impose heavy workload on server at `spike time`, also browsing is delayed if network is lagging.

Last but not least, `node-cryptojs-aes` frontend data masking is aimed at preventing frontend data hacker malicious behaviour, it can't stop MITM attack.

#### Decryption logic

The logic of browser decryption also can be divided into two parts.

##### Part 1
Retrieve passphrase with a AJAX call
```javascript
// define server passphrase JSONP path
var passphrase_url = "http://localhost:3000/crypto/passphrase?callback=?";
		
// JSONP AJAX call to node.js server running on localhost:3000
$.getJSON(passphrase_url, function(data){

	// retrieve passphrase string
    var r_pass_base64 = data.passphrase;

    console.log("passphrase: ");
    console.log(r_pass_base64);
		    
	// decipher part

});
```
##### Part 2
Last step, data is unmasked by calling browser AES script, take passphrase and JsonFormatter as parameter
```javascript
// take out masked data from div tag 
var encrypted_json_str = $("#data_store").text();
		    
// decrypt data with encrypted json string, passphrase string and custom JsonFormatter
var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });

// convert to Utf8 format unmasked data
var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);

console.log("decrypted string: " + decrypted_str);
		    
// convert into unmasked data and store in the div tag
$("#data_store").text(decrypted_str);		    
```
Last thing, don't forget to add browser AES script and JsonFormatter to your index.html file.
You can load it straight away via github CDN network

```html
<script type="text/javascript" src="http://chengxianga2008.github.com/node-cryptojs-aes/client/aes.js"></script>
<script type="text/javascript" src="http://chengxianga2008.github.com/node-cryptojs-aes/client/jsonformatter.js"></script>
```
Or you can find your own copy at client/ folder

## Installation

Install through npm

```
npm install node-cryptojs-aes
```

## Changelog

**node-cryptojs-aes** Version 0.3.8 - 23/02/2014
  
  * Upgrade to cryptojs v3.1
  * Test compatibility with nodes.js v0.10.26
  * Add express 3 use case
  * Refine the Readme document

**node-cryptojs-aes** Version 0.3.7 - 01/08/2012
  
  * Add browser side support

**node-cryptojs-aes** Version 0.3.4 - 21/07/2012

  * Update to cryptojs v3.0.2

## Donation

To support the developer's development and contribute to open source community and node.js community, you might donate money to help out your fellowmen, no matter how large or small, it all counts. With your effort, we can make a better world, Thank you.

[![Donate to developer](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QPDFGUA4XRX5E)


