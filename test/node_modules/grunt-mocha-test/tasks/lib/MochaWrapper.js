var domain = require('domain');
var fs = require('fs');
var path = require('path');

function MochaWrapper(params) {
  // If require option is specified then require that file.
  // This code has been adapted from the treatment of the require
  // option in the mocha source (bin/_mocha)
  var cwd = process.cwd();
  var join = path.join;
  var resolve = path.resolve;
  var exists = fs.existsSync;
  module.paths.push(cwd, join(cwd, 'node_modules'));
  if (params.options && params.options.require) {
    var mods = params.options.require instanceof Array ? params.options.require : [params.options.require];
    mods.forEach(function(mod) {
      var abs = exists(mod) || exists(mod + '.js');
      if (abs) {
        mod = resolve(mod);
      }
      require(mod);
    });
  }

  var Mocha = params.options.mocha || require('mocha');
  var mocha = new Mocha(params.options);

  if (params.options.clearRequireCache === true) {
    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key];
    });
  }

  params.files.forEach(function(file) {
    file.src.forEach(mocha.addFile.bind(mocha));
  });

  this.run = function(callback) {
    try {
      // This hack is a copy of the hack used in
      // https://github.com/gregrperkins/grunt-mocha-hack
      // to work around the issue that mocha lets uncaught exceptions
      // escape and grunt as of version 0.4.x likes to catch uncaught
      // exceptions and exit. It's nasty and requires intimate knowledge
      // of Mocha internals
      if (mocha.files.length) {
        mocha.loadFiles();
      }
      var mochaSuite = mocha.suite;
      var mochaOptions = mocha.options;
      var mochaRunner = new Mocha.Runner(mochaSuite);
      var mochaReporter = new mocha._reporter(mochaRunner);
      mochaRunner.ignoreLeaks = false !== mochaOptions.ignoreLeaks;
      mochaRunner.asyncOnly = mochaOptions.asyncOnly;
      if (mochaOptions.grep) {
        mochaRunner.grep(mochaOptions.grep, mochaOptions.invert);
      }
      if (mochaOptions.globals) {
        mochaRunner.globals(mochaOptions.globals);
      }
      if (mochaOptions.growl) {
        mocha._growl(mochaRunner, mochaReporter);
      }
      if (mocha.options.colors != null) {
        Mocha.reporters.Base.useColors = mocha.options.colors;
      }

      var runDomain = domain.create();
      runDomain.on('error', mochaRunner.uncaught.bind(mochaRunner));
      runDomain.run(function() {
        mochaRunner.run(function(failureCount) {
          callback(null, failureCount);
        });
      });
      // I wish I could just do this...
      //
      // mocha.run(function(failureCount) {
      //   callback(null, failureCount);
      // });
    } catch (error) {
      // catch synchronous (uncaught) exceptions thrown as a result
      // of loading the test files so that they can be reported with
      // better details
      callback(error);
    }
  };
}
module.exports = MochaWrapper;
