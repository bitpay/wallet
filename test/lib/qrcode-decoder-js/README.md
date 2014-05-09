JavaScript QR code decoder
==========================

This library is a QR code decoder/reader for HTML5 enabled browser.


Usage
-----
Set `qrcode.callback` to function "func(data)", where data will get the decoded information.

- Decode image with: `qrcode.decode(url or DataURL)`
- Decode from canvas with "qr-canvas" ID: `qrcode.decode()`


Credits
-------
This repo is a fork and port of Lazar Laszlo's [jsqrcode](https://github.com/LazarSoft/jsqrcode) repo.


Why another fork?
-----------------
Because I use this awesome library in my personal projects/work and I noticed that was not updated/improved since several months ago.
