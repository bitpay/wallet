# watchify

watch mode for browserify builds

Update any source file and your browserify bundle will be recompiled on the
spot.

# example

Use `watchify` with all the same arguments as `browserify` except that
`-o` is mandatory:

```
$ watchify main.js -o static/bundle.js
```

Now as you update files, `static/bundle.js` will be automatically re-compiled on
the fly.

You can use `-v` to get more verbose output to show when a file was written:

```
$ watchify browser.js -d -o static/bundle.js -v
610598 bytes written to static/bundle.js
610606 bytes written to static/bundle.js
610597 bytes written to static/bundle.js
610606 bytes written to static/bundle.js
610597 bytes written to static/bundle.js
610597 bytes written to static/bundle.js
```

# usage

All the bundle options are the same as the browserify command except for `-v`.

# methods

``` js
var watchify = require('watchify')
```

## var w = watchify(opts)

Create a browserify bundle `w` from `opts`.

`w` is exactly like a browserify bundle except that caches file contents and
emits an `'update'` event when a file changes. You should call `w.bundle()`
after the `'update'` event fires to generate a new bundle. Calling `w.bundle()`
extra times past the first time will be much faster due to caching.

# events

## w.on('update', function (ids) {})

When the bundle changes, emit the array of bundle `ids` that changed.

# install

With [npm](https://npmjs.org) do:

```
$ npm install -g watchify
```

to get the watchify command and:

```
$ npm install watchify
```

to get just the library.

# license

MIT
