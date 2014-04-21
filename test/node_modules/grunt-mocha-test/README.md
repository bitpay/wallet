# grunt-mocha-test

[![Build Status](https://travis-ci.org/pghalliday/grunt-mocha-test.png)](https://travis-ci.org/pghalliday/grunt-mocha-test)
[![Dependency Status](https://gemnasium.com/pghalliday/grunt-mocha-test.png)](https://gemnasium.com/pghalliday/grunt-mocha-test)

A grunt task for running server side mocha tests

## Usage

Install next to your project's Gruntfile.js with: 

```
$ npm install grunt-mocha-test
```

### Running tests

Here is a simple example gruntfile if you just want to run tests

```javascript
module.exports = function(grunt) {

  // Add the grunt-mocha-test tasks.
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    // Configure a mochaTest task
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }
  });

  grunt.registerTask('default', 'mochaTest');

};
```

The following mocha options are supported

- grep
- ui
- reporter
- timeout
- invert
- ignoreLeaks
- growl
- globals
- bail
- require
- colors (specify as "colors: true")

### Specifying compilers

The Mocha `--compilers` option is almost identical to the `--require` option but with additional functionality for use with the Mocha `--watch` mode. As the `--watch` mode is not relevant for this plugin there is no need to implement a separate `compilers` option and actually the `require` option should be used instead.

The following example shows the use of the CoffeeScript compiler.

```
$ npm install coffee-script
```

```javascript
mochaTest: {
  test: {
    options: {
      reporter: 'spec',
      require: 'coffee-script'
    },
    src: ['test/**/*.coffee']
  }
}
```

In order to make this more user friendly the `require` option can take either a single file or an array of files in case you have other globals you wish to require.

eg.

```javascript
mochaTest: {
  test: {
    options: {
      reporter: 'spec',
      require: [
        'coffee-script',
        './globals.js'
      ]
    },
    src: ['test/**/*.coffee']
  }
}
```

NB. The `require` option can only be used with Javascript files, ie. it is not possible to specify a `./globals.coffee` in the above example.

### Specifying a Mocha module

If you would like to use a different version of Mocha than the one packaged with this plugin, you can specify the module with the `mocha` option:

```
mochaTest: {
  test: {
    options: {
      mocha: require('mocha')
    },
    src: ['test/**/*.coffee']
  }
}
```

### Generating coverage reports

Here is an example gruntfile that registers 2 test tasks, 1 to run the tests and 1 to generate a coverage report using `blanket.js` to instrument the javascript on the fly.

```
$ npm install blanket
```

```javascript
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          // Require blanket wrapper here to instrument other required
          // files on the fly. 
          //
          // NB. We cannot require blanket directly as it
          // detects that we are not running mocha cli and loads differently.
          //
          // NNB. As mocha is 'clever' enough to only run the tests once for
          // each file the following coverage task does not actually run any
          // tests which is why the coverage instrumentation has to be done here
          require: 'coverage/blanket'
        },
        src: ['test/**/*.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          // use the quiet flag to suppress the mocha console output
          quiet: true,
          // specify a destination file to capture the mocha
          // output (the quiet option does not suppress this)
          captureFile: 'coverage.html'
        },
        src: ['test/**/*.js']
      }
    }
  });

  grunt.registerTask('default', 'mochaTest');
};
```

As noted above it is necessary to wrap the blanket require when calling mocha programatically so `coverage/blanket.js` should look something like this.

```javascript
require('blanket')({
  // Only files that match the pattern will be instrumented
  pattern: '/src/'
});
```

### Failing tests if a coverage threshold is not reached

Building on the previous example, if you wish to have your tests fail if it falls below a certain coverage threshold then I advise using the `travis-cov` reporter

```
$ npm install travis-cov
```

```javascript
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: 'coverage/blanket'
        },
        src: ['test/**/*.js']
      },
      'html-cov': {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage.html'
        },
        src: ['test/**/*.js']
      },
      // The travis-cov reporter will fail the tests if the
      // coverage falls below the threshold configured in package.json
      'travis-cov': {
        options: {
          reporter: 'travis-cov'
        },
        src: ['test/**/*.js']
      }
    }
  });

  grunt.registerTask('default', 'mochaTest');
};
```

Don't forget to update `package.json` with options for `travis-cov`, for example:

```javascript
  ...

  "scripts": {
    "test": "grunt",
    "travis-cov": {
      // Yes, I like to set the coverage threshold to 100% ;)
      "threshold": 100
    }
  },

  ...
```

NB. This is no longer supported in the latest version of NPM where `scripts` can only be strings. There is currently a pull request open on `travis-cov` to move the configuration to the `config` entry.

https://github.com/alex-seville/travis-cov/issues/2

### Running in permanent environments (like watch)

In some instances, for example when you are running grunt-mocha-test in a grunt watch environment using the `spawn: false` option, you might get in a spot where each test is run only once. After that it will be ignored until
you always get: `0 passing` as a result of your tests.

This happens because mocha loads your test using require. Thus once it has been loaded once in a specific process, it won't run again. To prevent this from happening, use the `clearRequireCache` option (default value is `false`).

Here is an example allowing you to run only the modified tests when possible:

```javascript
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: true
        },
        src: ['test/**/*.js']
      },
    },

    watch: {
      js: {
        options: {
          spawn: false,
        },
        files: '**/*.js',
        tasks: ['check']
      }
    }
  });

  // On watch events configure mochaTest to run only on the test if it is one
  // otherwise, run the whole testsuite
  var defaultSimpleSrc = grunt.config('mochaTest.simple.src');
  grunt.event.on('watch', function(action, filepath) {
    grunt.config('mochaTest.simple.src', defaultSimpleSrc);
    if (filepath.match('test/')) {
      grunt.config('mochaTest.simple.src', filepath);
    }
  });

  grunt.registerTask('default', 'mochaTest');
};
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using: 

```
$ npm test
```

### Using Vagrant
To use the Vagrantfile you will also need to install the following bindler plugin to manage the other plugin dependencies.

```
vagrant plugin install bindler
vagrant bindler setup
```

Then install the required plugins with

```
vagrant plugin bundle
```

## License
Copyright &copy; 2013 Peter Halliday  
Licensed under the MIT license.
