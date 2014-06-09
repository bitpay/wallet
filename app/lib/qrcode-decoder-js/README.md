JavaScript QR code decoder
==========================

This library is a QR code decoder/reader for HTML5 enabled browser.

Install
-------
Just run `$ bower install qrcode-decoder-js`

Include the library `<script src="path/to/qrcode-decoder-js/lib/qrcode-decoder.min.js"></script>`

Usage
-----
Set `qrcode.callback` to function "func(data)", where data will get the decoded information.

- Decode image with: `qrcode.decode(url or DataURL)`
- Decode from canvas with "qr-canvas" ID: `qrcode.decode()`


Development
-----------
If you want to improve the code and send your pull request, you will need:

Clone this repository

`$ git clone https://github.com/colkito/qrcode-decoder-js.git`

`$ cd qrcode-decoder-js`

Install dev dependencies

`$ npm install`

To compile and minify the lib

`$ grunt compile`

There is a convinent Gruntfile.js for automation during editing the code

`$ grunt`

Credits
-------
This repo is a fork and port of Lazar Laszlo's [jsqrcode](https://github.com/LazarSoft/jsqrcode).


Why another fork?
-----------------
Because I use this awesome library in my personal projects/work and I noticed that was not updated/improved since several months ago.
