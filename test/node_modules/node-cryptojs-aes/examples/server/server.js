// All script run in node.js Javascript Engine
// run in  command line
// ~/node server.js


// encryption logic here
//1. First part on the server side, create random passphrase as key.

//import crypto module to generate random binary data
var crypto = require('crypto'); 

//generate random passphrase binary data
var r_pass = crypto.randomBytes(128);

//convert passphrase to base64 format
var r_pass_base64 = r_pass.toString("base64");

console.log("passphrase base64 format: ");
console.log(r_pass_base64);
console.log("\n");

//2. Second part on the server side, actual data encryption.

//import node-cryptojs-aes modules to encrypt or decrypt data
var node_cryptojs = require('node-cryptojs-aes');

//node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;

//custom json serialization format
var JsonFormatter = node_cryptojs.JsonFormatter;

//message to cipher
var message = "I love maccas!";

//encrypt plain text with passphrase and custom json serialization format, return CipherParams object
//r_pass_base64 is the passphrase generated from first stage
//message is the original plain text  

var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });

//convert CipherParams object to json string for transmission
var encrypted_json_str = encrypted.toString();

console.log("serialized CipherParams object: ");
console.log(encrypted_json_str);

//////////////////////////////////////////////////////////////////
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