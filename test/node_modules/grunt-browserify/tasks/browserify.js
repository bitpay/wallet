/*
* grunt-browserify
* https://github.com/jmreidy/grunt-browserify
*
* Copyright (c) 2013 Justin Reidy
* Licensed under the MIT license.
*/
'use strict';
var Runner = require('../lib/runner');
var path = require('path');
var async = require('async');

module.exports = Task;

function Task (grunt) {
  grunt.registerMultiTask('browserify', 'Grunt task for browserify.', function () {
    var task = this;
    async.forEachSeries(this.files, function (file, next) {
      Task.runTask(grunt, task.options(), file, next);
    }, this.async());
  });
}

Task.runTask = function (grunt, options, file, next) {
  var runner = new Runner({writer: grunt.file, logger: grunt});
  var files = grunt.file.expand({filter: 'isFile'}, file.src).map(function (f) {
    return path.resolve(f);
  });
  runner.run(files, file.dest, options, next);
};
