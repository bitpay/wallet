/* global beforeEach, describe, context, it */
'use strict';
var Sinon = require('sinon');
var assert = require('assert');
var path = require('path');
var browserify = require('browserify');
var Runner = require('../lib/runner');
var _ = require('lodash');

describe('grunt-browserify-runner', function () {
  var dest = 'path/To/Dest';

  it('instatiates browserify', function (done) {
    var b = spyBrowserify();
    var runner = createRunner(b);
    runner.run([], dest, {}, function () {
      assert.equal(b.callCount, 1);
      done();
    });
  });

  it('assigns source files as bundle entries', function (done) {
    var b = spyBrowserify();
    var files = [path.resolve('./package.json')];
    var runner = createRunner(b);
    runner.run(files, dest, {}, function () {
      assert.ok(b.calledWith({entries: files}));
      done();
    });
  });

  it('invokes the bundler', function (done) {
    var b = stubBrowserify('bundle');
    var runner = createRunner(b);
    runner.run([], dest, {}, function () {
      assert.equal(b().bundle.callCount, 1);
      done();
    });
  });

  context('when bundle options are provided', function () {
    it('passes browserifyBundleOptions to bundle', function (done) {
      var b = stubBrowserify('bundle');
      var opts = {};
      var runner = createRunner(b);
      runner.run([], dest, {bundleOptions: opts}, function () {
        assert.ok(b().bundle.calledWith(opts));
        done();
      });
    });
  });

  it('writes the bundle to the provided dest', function (done) {
    var b = spyBrowserify();
    var runner = createRunner(b);
    runner.run([], dest, {}, function () {
      assert.ok(runner.writer.write.calledWith(dest));
      done();
    });
  });


  context('when passing option of watch:true', function () {
    var baseOpts = {watch:true};
    it('invokes watchify instead of browserify', function (done) {
      var watchify = spyWatchify();
      var runner = createRunner(undefined, watchify);
      runner.run([], dest, baseOpts, function () {
        assert.equal(watchify.callCount, 1);
        done();
      });
    });
  });


  describe('when passing hash of browserifyOptions', function () {
    it('instantiates browserify with those options', function (done) {
      var browserify = spyBrowserify();
      var bOpts = {foo: 'bar'};
      var runner = createRunner(browserify);
      runner.run([], dest, {browserifyOptions: bOpts}, function () {
        assert.ok(browserify.calledWith(bOpts));
        done();
      });
    });
  });

  describe('when passing option of require', function () {
    it('requires each item in the array', function (done) {
      var b = stubBrowserify('require');
      var requireList = ['./package.json'];
      var runner = createRunner(b);
      runner.run([], dest, {require: requireList}, function () {
        assert.ok(b().require.calledWith(requireList[0]));
        done();
      });
    });
  });

  describe('when passing option of exclude', function () {
    it('excludes each item in the array', function (done) {
      var b = stubBrowserify('exclude');
      var excludeList = ['./package.json', 'lodash'];
      var runner = createRunner(b);
      runner.run([], dest, {exclude: excludeList}, function () {
        assert.ok(b().exclude.calledWith(excludeList[0]));
        assert.ok(b().exclude.calledWith(excludeList[1]));
        done();
      });
    });
    it('excludes globbed file results', function (done) {
      var b = stubBrowserify('exclude');
      var excludeList = ['./*.json'];
      var files = _.map(['./package.json'], function (file) {
        return path.resolve(file);
      });
      var runner = createRunner(b);
      runner.run([], dest, {exclude: excludeList}, function () {
        assert.ok(b().exclude.calledWith(files[0]));
        done();
      });
    });
  });

  describe('when passing option of ignore', function () {
    it('ignores the resolved filename of each item in the array', function (done) {
      var b = stubBrowserify('ignore');
      var ignoreList = ['./package.json'];
      var files = _.map(ignoreList, function (file) {
        return path.resolve(file);
      });
      var runner = createRunner(b);
      runner.run([], dest, {ignore: ignoreList}, function () {
        assert.ok(b().ignore.calledWith(files[0]));
        done();
      });
    });
    it('ignores globbed file results', function (done) {
      var b = stubBrowserify('ignore');
      var ignoreList = ['./*.json'];
      var files = _.map(['./package.json'], function (file) {
        return path.resolve(file);
      });
      var runner = createRunner(b);
      runner.run([], dest, {ignore: ignoreList}, function () {
        assert.ok(b().ignore.calledWith(files[0]));
        done();
      });
    });
  });

  describe('when passing option of alias', function () {
    var b, runner;
    var pathAliasList = ['./package.json:alias'];
    var files = _.map(pathAliasList, function (file) {
      return path.resolve(file.split(':')[0]);
    });
    var moduleAliasList = ['path:pathAlias'];
    var modules = _.map(moduleAliasList, function(module) {
      return module.split(':')[0];
    });
    var aliasList = pathAliasList.concat(moduleAliasList);
    var aliases = files.concat(modules);

    beforeEach(function () {
      b = stubBrowserify('require');
      runner = createRunner(b);
    });

    it('tries the resolved filename of each item in the array', function (done) {
      runner.run([], dest, {alias: pathAliasList}, function () {
        assert.ok(b().require.calledWith(files[0]));
        done();
      });
    });

    it('tries the module name of each item in the array', function (done) {
      runner.run([], dest, {alias: moduleAliasList}, function () {
        assert.ok(b().require.calledWith(modules[0]));
        done();
      });
    });

    it('specifies the provided alias for each item in the array', function (done) {
      runner.run([], dest, {alias: aliasList}, function () {
        assert.ok(b().require.calledWith(aliases[0], {expose: 'alias'}));
        assert.ok(b().require.calledWith(aliases[1], {expose: 'pathAlias'}));
        done();
      });
    });
  });

  describe('when passing option of external', function () {
    it('marks each array element as external', function (done) {
      var b = stubBrowserify('external');
      var externalList = ['./package.json', 'foobar'];
      var runner = createRunner(b);
      runner.run([], dest, {external: externalList}, function () {
        assert.ok(b().external.calledWith(externalList[0]));
        assert.ok(b().external.calledWith(externalList[1]));
        done();
      });
    });

    context('when provided with an alias array', function () {
      it('marks the aliases as external', function (done) {
        var b = stubBrowserify('external');
        var runner = createRunner(b);
        var aliasList = ['./package.json:alias'];
        runner.run([], dest, {external: aliasList}, function () {
          assert.ok(b().external.calledWith('alias'));
          done();
        });
      });
    });

    context('when provided with a glob', function () {
      it('marks each glob result as external', function (done) {
        var b = stubBrowserify('external');
        var externalList = ['./*.json', 'foobar'];
        var runner = createRunner(b);
        runner.run([], dest, {external: externalList}, function () {
          assert.ok(b().external.calledWith(path.resolve('./package.json')));
          assert.ok(b().external.calledWith(externalList[1]));
          done();
        });
      });
    });
  });

  describe('when passing option of transform', function () {
    var b, runner;

    beforeEach(function () {
      b = stubBrowserify('transform');
      runner = createRunner(b);
    });

    it('invokes each array element as a transform', function (done) {
      var transforms = [function () {}];
      runner.run([], dest, {transform: transforms}, function () {
        assert.ok(b().transform.calledWith(transforms[0]));
        done();
      });
    });
    context('if an options hash is provided', function () {
      it('passes the options hash along with the transform fn', function (done) {
        var transforms = [[function () {}, {}]];
        runner.run([], dest, {transform: transforms}, function () {
          assert.ok(b().transform.calledWith(transforms[0][1], transforms[0][0]));
          done();
        });
      });
    });
  });

  describe('when passing option of preBundleCB', function () {
    it('calls the provided callback before bundling', function (done) {
      var cb = Sinon.stub();
      var b = stubBrowserify('bundle');
      var runner = createRunner(b);
      runner.run([], dest, {preBundleCB: cb}, function () {
        assert.ok(cb.calledOnce);
        assert.ok(cb.calledBefore(b().bundle));
        done();
      });
    });
  });

  describe('when passing option of postBundleCB', function () {
    it('calls the provided callback after bundling', function (done) {
      var cb = Sinon.stub().yields();
      var b = stubBrowserify('bundle');
      var runner = createRunner(b);
      runner.run([], dest, {postBundleCB: cb}, function () {
        assert.ok(cb.calledOnce);
        assert.ok(cb.calledAfter(b().bundle));
        done();
      });
    });
  });

  describe('when passing option of plugin', function () {
    it('registers the plugin', function (done) {
      var b = stubBrowserify('plugin');
      var runner = createRunner(b);
      var plugin = function () {};
      runner.run([], dest, {plugin: [plugin]}, function () {
        assert.ok(b().plugin.calledWith(plugin));
        done();
      });
    });
    context('and when passing plugin options', function () {
      it('registers the plugin options', function (done) {
        var b = stubBrowserify('plugin');
        var runner = createRunner(b);
        var plugin = function () {};
        var opts = {};
        runner.run([], dest, {plugin: [[plugin, opts]]}, function () {
          assert.ok(b().plugin.calledWith(plugin, opts));
          done();
        });
      });
    });
  });

});

function createRunner(browserify, watchify) {
  return new Runner({
    browserify: browserify,
    watchify: watchify,
    logger: stubLogger(),
    writer: stubGruntFile()
  });
}

function stubGruntFile() {
  return Sinon.stub({
    exists: function () {

    },
    write: function () {

    },
    mkdir: function () {

    }
  });
}

function stubLogger() {
  return Sinon.stub({
    log: {
      ok: function (msg) {
        //console.log(msg);
      },
      error: function (msg) {
        //console.log(msg);
      }
    },
    fail: {
      warn: function (msg) {
        //console.log(msg);
      }
    },
    error: function (msg) {
      //console.log(msg);
    }
  });
}

function spyBrowserify() {
  return Sinon.spy(browserify);
}

function stubBrowserify(spyMethod) {
  var b = browserify();
  if (spyMethod) {
    Sinon.spy(b, spyMethod);
  }
  return Sinon.stub().returns(b);
}

function spyWatchify() {
  return Sinon.spy(require('watchify'));
}
