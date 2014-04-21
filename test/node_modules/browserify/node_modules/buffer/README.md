# buffer [![build](https://img.shields.io/travis/feross/buffer.svg)](https://travis-ci.org/feross/buffer) [![npm](https://img.shields.io/npm/v/buffer.svg)](https://npmjs.org/package/buffer) [![npm downloads](https://img.shields.io/npm/dm/buffer.svg)](https://npmjs.org/package/buffer) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

#### The buffer module from [node.js](http://nodejs.org/), for the browser.

[![testling badge](https://ci.testling.com/feross/buffer.png)](https://ci.testling.com/feross/buffer)

When you `require('buffer')` or use the `Buffer` global in [browserify](http://github.com/substack/node-browserify), this module will automatically load.

The goal is to provide a Buffer API that is 100% identical to node's Buffer API. Read
the [official node.js docs](http://nodejs.org/api/buffer.html) for a full list of
supported methods.

## features

- Backed by Typed Arrays (`Uint8Array` and `ArrayBuffer`) (not `Object`, so it's fast)
- Extremely small bundle size (**5.04KB minified + gzipped**, 35.5KB with comments)
- Excellent browser support (IE 6+, Chrome 4+, Firefox 3+, Safari 5.1+, Opera 11+, iOS, etc.)
- Preserves Node API exactly, with one important difference (see below)
- Faster pretty much across the board (see perf results below)
- `.slice()` returns instances of the same type (Buffer)
- Square-bracket `buf[4]` notation works, even in old browsers like IE6!
- Does not modify any browser prototypes or put anything on `window`.
- Comprehensive test suite.


## install

If you want to use this module directly without browserify, install it:

```bash
npm install buffer
```

This module was previously called **native-buffer-browserify**, but please use **buffer**
from now on.


## usage

As mentioned before, when you `require('buffer')` or use the `Buffer` global in [browserify](http://github.com/substack/node-browserify), this module will automatically
be included in your bundle so you get a `Buffer` API that actually works in the browser.

If you're depending on this module explicitly, then require it like this:

```js
var Buffer = require('buffer/').Buffer  // use the npm module, not the core module!
```

The module's API is 100% identical to node's `Buffer` API. Read the
[official docs](http://nodejs.org/api/buffer.html) for the full list of properties,
instance methods, and class methods supported by `Buffer`.


## how does it work?

The `Buffer` constructor returns instances of `Uint8Array` that are augmented with function properties for all the `Buffer` API functions. We use `Uint8Array` so that square bracket notation works as expected -- it returns a single octet. By augmenting the instances, we can avoid modifying the `Uint8Array` prototype.


## differences

#### IMPORTANT: always use `Buffer.isBuffer` instead of `instanceof Buffer`

The Buffer constructor returns a `Uint8Array` (with all the Buffer methods added as
properties on the instance) for performance reasons, so `instanceof Buffer` won't work. In
node, you can use either `Buffer.isBuffer` or `instanceof Buffer` to check if an object
is a `Buffer`. But, in the browser you must use `Buffer.isBuffer` to detect the special
`Uint8Array`-based Buffers.

#### Minor: `buf.slice()` does not modify parent buffer's memory in all browsers

If you only support modern browsers (specifically, those with typed array support), then
this issue does not affect you.

In node, the `slice()` method returns a new `Buffer` that shares underlying memory with
the original Buffer. When you modify one buffer, you modify the other. [Read more.](http://nodejs.org/api/buffer.html#buffer_buf_slice_start_end)

This works correctly in browsers with typed array support (\* with the exception of Firefox older than version 30). Browsers that lack typed arrays get an alternate buffer implementation based on `Object` which has no mechanism to point separate `Buffer`s to the same underlying slab of memory.

\* *Firefox older than version 30 gets the `Object` implementation -- not the typed arrays one -- because of [this
bug](https://bugzilla.mozilla.org/show_bug.cgi?id=952403) that made it impossible to add properties to a typed array.*


## performance

See perf tests in `/perf`.

```
# Chrome 33

NewBuffer#bracket-notation x 11,194,815 ops/sec ±1.73% (64 runs sampled)
OldBuffer#bracket-notation x 9,546,694 ops/sec ±0.76% (67 runs sampled)
Fastest is NewBuffer#bracket-notation

NewBuffer#concat x 949,714 ops/sec ±2.48% (63 runs sampled)
OldBuffer#concat x 634,906 ops/sec ±0.42% (68 runs sampled)
Fastest is NewBuffer#concat

NewBuffer#copy x 15,436,458 ops/sec ±1.74% (67 runs sampled)
OldBuffer#copy x 3,990,346 ops/sec ±0.42% (68 runs sampled)
Fastest is NewBuffer#copy

NewBuffer#readDoubleBE x 1,132,954 ops/sec ±2.36% (65 runs sampled)
OldBuffer#readDoubleBE x 846,337 ops/sec ±0.58% (68 runs sampled)
Fastest is NewBuffer#readDoubleBE

NewBuffer#new x 1,419,300 ops/sec ±3.50% (66 runs sampled)
Uint8Array#new x 3,898,573 ops/sec ±0.88% (67 runs sampled) (used internally by NewBuffer)
OldBuffer#new x 2,284,568 ops/sec ±0.57% (67 runs sampled)
Fastest is Uint8Array#new

NewBuffer#readFloatBE x 1,203,763 ops/sec ±1.81% (68 runs sampled)
OldBuffer#readFloatBE x 954,923 ops/sec ±0.66% (70 runs sampled)
Fastest is NewBuffer#readFloatBE

NewBuffer#readUInt32LE x 750,341 ops/sec ±1.70% (66 runs sampled)
OldBuffer#readUInt32LE x 1,408,478 ops/sec ±0.60% (68 runs sampled)
Fastest is OldBuffer#readUInt32LE

NewBuffer#slice x 1,802,870 ops/sec ±1.87% (64 runs sampled)
OldBuffer#slice x 1,725,928 ops/sec ±0.74% (68 runs sampled)
Fastest is NewBuffer#slice

NewBuffer#writeFloatBE x 830,407 ops/sec ±3.09% (66 runs sampled)
OldBuffer#writeFloatBE x 508,446 ops/sec ±0.49% (69 runs sampled)
Fastest is NewBuffer#writeFloatBE

# Node 0.11

NewBuffer#bracket-notation x 10,912,085 ops/sec ±0.89% (92 runs sampled)
OldBuffer#bracket-notation x 9,051,638 ops/sec ±0.84% (92 runs sampled)
Buffer#bracket-notation x 10,721,608 ops/sec ±0.63% (91 runs sampled)
Fastest is NewBuffer#bracket-notation

NewBuffer#concat x 1,438,825 ops/sec ±1.80% (91 runs sampled)
OldBuffer#concat x 888,614 ops/sec ±2.09% (93 runs sampled)
Buffer#concat x 1,832,307 ops/sec ±1.20% (90 runs sampled)
Fastest is Buffer#concat

NewBuffer#copy x 5,987,167 ops/sec ±0.85% (94 runs sampled)
OldBuffer#copy x 3,892,165 ops/sec ±1.28% (93 runs sampled)
Buffer#copy x 11,208,889 ops/sec ±0.76% (91 runs sampled)
Fastest is Buffer#copy

NewBuffer#readDoubleBE x 1,057,233 ops/sec ±1.28% (88 runs sampled)
OldBuffer#readDoubleBE x 4,094 ops/sec ±1.09% (86 runs sampled)
Buffer#readDoubleBE x 1,587,308 ops/sec ±0.87% (84 runs sampled)
Fastest is Buffer#readDoubleBE

NewBuffer#new x 739,791 ops/sec ±0.89% (89 runs sampled)
Uint8Array#new x 2,745,243 ops/sec ±0.95% (91 runs sampled)
OldBuffer#new x 2,604,537 ops/sec ±0.93% (88 runs sampled)
Buffer#new x 1,836,218 ops/sec ±0.74% (92 runs sampled)
Fastest is Uint8Array#new

NewBuffer#readFloatBE x 1,111,263 ops/sec ±0.41% (97 runs sampled)
OldBuffer#readFloatBE x 4,026 ops/sec ±1.24% (90 runs sampled)
Buffer#readFloatBE x 1,611,800 ops/sec ±0.58% (96 runs sampled)
Fastest is Buffer#readFloatBE

NewBuffer#readUInt32LE x 502,024 ops/sec ±0.59% (94 runs sampled)
OldBuffer#readUInt32LE x 1,259,028 ops/sec ±0.79% (87 runs sampled)
Buffer#readUInt32LE x 2,778,635 ops/sec ±0.46% (97 runs sampled)
Fastest is Buffer#readUInt32LE

NewBuffer#slice x 1,174,908 ops/sec ±1.47% (89 runs sampled)
OldBuffer#slice x 2,396,302 ops/sec ±4.36% (86 runs sampled)
Buffer#slice x 2,994,029 ops/sec ±0.79% (89 runs sampled)
Fastest is Buffer#slice

NewBuffer#writeFloatBE x 721,081 ops/sec ±1.10% (86 runs sampled)
OldBuffer#writeFloatBE x 4,020 ops/sec ±1.04% (92 runs sampled)
Buffer#writeFloatBE x 1,811,134 ops/sec ±0.67% (91 runs sampled)
Fastest is Buffer#writeFloatBE
```


## credit

This was originally forked from [buffer-browserify](https://github.com/toots/buffer-browserify).


## license

MIT. Copyright (C) [Feross Aboukhadijeh](http://feross.org), and other contributors. Originally forked from an MIT-licensed module by Romain Beauxis.
