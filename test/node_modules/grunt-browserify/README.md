[![build status](https://secure.travis-ci.org/jmreidy/grunt-browserify.png)](http://travis-ci.org/jmreidy/grunt-browserify)
[![NPM version](https://badge.fury.io/js/grunt-browserify.png)](http://badge.fury.io/js/grunt-browserify)
# grunt-browserify

Grunt task for node-browserify.

## Getting Started
This plugin requires [Grunt](https://gruntjs.com) `~0.4.0`.

Install this grunt plugin with:
```shell
npm install grunt-browserify --save-dev
```

Then add this line to your project's `grunt.js` Gruntfile:

```javascript
grunt.loadNpmTasks('grunt-browserify');
```

## In the Wild
Most simply, Browserify is a tool for taking your CommonJS-style Javascript
code and packaging it for use in the browser. Grunt-Browserify provides the
glue to better integrate Browserify into your Grunt-based development workflow.

For JavaScripters unfamiliar with CJS-style code and the Node ecosystem, moving
to Browserify can be a bit confusing. Writing your client-side code as CJS
modules allows for smaller, easier to understand files that perform one task
well. These modules, because of their simplicity, will be significantly easier
to use across projects. CJS modules also help to expose the dependency graph
inherent in your code, allowing you to write cleaner, more-maintainable
modules. As [Alex MacCaw writes](http://spinejs.com/docs/commonjs):
>CommonJS modules are one of the best solutions to JavaScript dependency
>management.

>CommonJS modules solve JavaScript scope issues by making sure each module is
>executed in its own namespace. Modules have to explicitly export variables
>they want to expose to other modules, and explicitly import other modules; in
>other words, there's no global namespace.

(A note to AMD fans that the benefits above are not unique to the CJS
style of writing JavaScript modules, but the ease-of-interoperality with
Node.JS code is a plus of CJS.)

As you begin to write your client-side code in small, reusable modules, you
start to have a lot more files to manage. At the same time, you need to
integrate these files with other client-side libraries, some of which do not
play particularly nicely with a CJS module system. The simplicity provided by
CJS modules can be lost as build complexity is increased and Browserify
compilation time gets out of control.


## Documentation
Run this task with the `grunt browserify` command. As with other Grunt plugins, the `src` and `dest` properties are most important: `src` will use the Grunt glob pattern to specify files for inclusion in the browserified package, and `dest` will specify the outfile for the compiled module.

The current version of grunt-browserify sticks as close to the core browserify API as possible. Additional functionality can be added via the rich ecosystem of browserify transforms and plugins.

The following task options are supported:

#### alias
Type: `[String:String]`

Browserify can alias files or modules to a certain name. For example, `require(‘./foo’)` can be aliased to be used as `require(‘foo’)`. Aliases should be specified as `fileName:alias`.  Filenames are parsed into their full paths with `path.resolve`. Module names will be required directly.

#### require
Type: `[String]`

Specifies files to be required in the browserify bundle. String filenames are parsed into their full paths with `path.resolve`.

#### ignore
Type: `[String]`

Specifies files to be ignored in the browserify bundle.
String filenames are parsed into their full paths with `path.resolve`.
Globbing patterns are supported.

#### exclude
Type: `[String]`

Specifies files or modules to be excluded in the browserify bundle.
Globbing patterns are supported; globbed filenames are parsed into their full paths.

#### external
Type: `[String]` or `[String:String]`.

Specifies id strings which will be loaded from a previously loaded, “common” bundle.
That is to say, files in the bundle that require the target String will assume
that the target is provided externally.

The secondary form of this option
follows the format of `alias` above, and will externalise the ids specified in
the alias array. This second form allows for the declaration of a single alias
array which can be supplied to one bundle's `alias` option and another option's
`external` option.

In either case, globbing patterns are supported.


#### transform
Type: `[String || Function]` or `[[String || Function,  Object]]`

Specifies a pipeline of functions (or modules) through which the browserified bundle will be run. The transform can either be a literal function, or a string referring to a NPM module. The [browserify docs themselves](https://github.com/substack/node-browserify#btransformtr) explain transform well, but below is an example of transform used with `grunt-browserify` to automatically compile coffeescript files for use in a bundle:

```javascript
browserify: {
  dist: {
    files: {
      'build/module.js': ['client/scripts/**/*.js', 'client/scripts/**/*.coffee'],
    },
    options: {
      transform: ['coffeeify']
    }
  }
}
```

Transforms can also be provided with an options hash; in this case, the transform should be specified as an array of `[transformStringOrFn, optionsHash]`.

#### plugin
Type: `[String || Function]`
Register a browserify plugin with the bundle. As with transforms, plugins are identified with either their NPM name (String) or a function literal.

#### browserifyOptions
Type: Object
A hash of options that are passed to browserify during instantiation.

#### bundleOptions
Type: Object
A hash of options that are passed to `browserify. bundle`. If you are interested in generating
source maps, you can pass `debug: true` here. Other `bundleOptions` can be found on the
[Browserify Github README](https://github.com/substack/node-browserify#bbundleopts-cb).

#### watch
Type: Boolean
If true, invoke [watchify](https://github.com/substack/watchify) instead of browserify.

#### keepAlive
Type: Boolean
If true and if `watch` above is true, keep the Grunt process alive (simulates grunt-watch functionality).

#### preBundleCB
Type: `Function (b)`

An optional callback function, that will be called before bundle completion.
`b` is the `browerify` instance that will output the bundle.

#### postBundleCB
Type: `Function (err, src, next)`

An optional callback function, which will be called after bundle completion and
before writing of the bundle. The `err` and `src` arguments are provided
directly from browserify. The `next` callback should be called with `(err,
modifiedSrc)`; the `modifiedSrc` is what will be written to the output file.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

### v0.1.0
  - Initial release

### v0.1.1
  - Properly support compact and full grunt task syntax

### v0.2.0
  - Add support for Browserify 2

### v0.2.4
  - Add externalize option, to expose modules to external bundles
  - Add browserify-shim support
  - Completely rewrote and significantly improved tests
  - Various fixes

### v0.2.5
  - Update externalize to expose npm modules to external bundles

### v1.0.0
  - Really should've been released at v0.2, but better late than never!

### v1.0.2
  - Move away from browserify-stream to callback approach

### v1.0.3
  - Add new aliasMappings functionality

### v1.0.4
  - Adding directory support for `external` parameter

### v1.0.5
  - Bumping to latest Browserify (2.18.x)

### v1.1.0
  - Added support for noParse option
  - Change browserify() call to pass files as opts.entries

### v1.1.1
  - Fix regression where shimmed modules not being parsed

### v1.2
  - `Externalize` has been deprecated in favor of `alias` (#69)
  - Allow `external` to use module names, in addition to file paths (#68). Waiting on Browserify changes for this to actually work.
  - Much improved docs (#67)
  - Allow non-files to be ignored (#50), via @joshuarubin

### v1.2.1
  - Bumping dependency versions

### v1.2.2
  - Change `alias` destination behavior to only treat the destination as a
    filepath if it exists

### v1.2.3
  - Allow aliasing with arbitrary ids. For example, you could alias `./vendor/client/jquery/jquery.js` to `/vendor/jquery`
  for consumption by other bundles. See the updated `complex` and `externals` examples

### v1.2.4
  - Flatten options arrays, to prevent any weird behavior (via @joeybaker)

### v1.2.5
  - Documentation fix (via @alanshaw)
  - Allow aliasing inner modules (via @bananushka)
  - Fix multitask shim bug (via @byronmwong)

### v1.2.6
  - Move browserify to a peer dependency, to allow custom versions (via @nrn)
  - Add support for browserify extension flag (from browserify v2.31)

### v1.2.7
  - Fix bug in sharing shimmed files across bundles (#89)

### v1.2.8
  - Add postBundle callback support (via @Bockit)

### v1.2.9
  - Fix peerDependency version requirements

### v1.2.10
  - Fix #106

### v1.2.11
  - Move to browserify 2.35 for upstream dedupe fix

### v1.2.12
  - Add `preBundleCB` option (via @alexstrat)

### v1.3.0
  - Bump to Browserify v3

### v1.3.1
  - Adding support for Browserify 3.2 paths (via @trevordixon)

### v1.3.2
  - Adding `require` and global `transform` options.

### v2.0.1
- Complete rewrite of grunt-browserify internals, and update of the API.
(2.0.0 was mis-published to NPM and removed).

### v2.0.2
- Remove browserify-shim dependency, since it's now an optional transform

### v2.0.3
- Restore keepAlive and watch support.

### v2.0.4
- Allow `alias` to work with modules. (via @daviwil)

### v2.0.5
- Update deps

### v2.0.6
- Add support for globbing patterns for ignore, exclude, and external

### v2.0.7
- Allow watchify bundle updates to fail without killing grunt

### v2.0.8
- Exclude should only resolve filenames for glob patterns.

## License
Copyright (c) 2013-2014 Justin Reidy
Licensed under the MIT license.
