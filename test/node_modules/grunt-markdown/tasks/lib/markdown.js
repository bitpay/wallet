/*
 * grunt-markdown
 * https://github.com/treasonx/grunt-markdown
 *
 * Copyright (c) 2012 James Morrin
 * Licensed under the MIT license.
 */

'use strict';

// external libs
var markdown = require('marked');
var hljs = require('highlight.js');
var _ = require('lodash');

exports.init = function(grunt) {
  var exports = {};

  exports.markdown = function(src, options, template) {

    var html = null;
    var templateContext = null;
    var codeLines = options.codeLines;
    var shouldWrap = codeLines && codeLines.before && codeLines.after;

    function wrapLines(code) {
      var out = [];
      var before = codeLines.before;
      var after = codeLines.after;
      code = code.split('\n');
      code.forEach(function(line) {
        out.push(before+line+after);
        });
      return out.join('\n');
    }

    if(options.markdownOptions && typeof options.markdownOptions === 'object'){
      if(typeof options.markdownOptions.highlight === 'string') {
        if(options.markdownOptions.highlight === 'auto') {
          options.markdownOptions.highlight = function(code) {
            var out = hljs.highlightAuto(code).value;
            if(shouldWrap) {
              out = wrapLines(out);
            }
            return out;
          };
        } else if (options.markdownOptions.highlight === 'manual') {
          options.markdownOptions.highlight = function(code, lang) {
            var out = code;
            try {
              out = hljs.highlight(lang, code).value;
            } catch(e) {
              out = hljs.highlightAuto(code).value;
            }
            if(shouldWrap) {
              out = wrapLines(out);
            }
            return out;
          };
        }

      }
    }

    markdown.setOptions(options.markdownOptions);

    grunt.verbose.write('Marking down...');

    if(_.isFunction(options.templateContext)) {
      templateContext = options.templateContext();
    } else {
      templateContext = options.templateContext;
    }

    src = options.preCompile(src, templateContext) || src;
    html = markdown(src);
    html = options.postCompile(html, templateContext) || html;

    templateContext.content = html;

    src = _.template(template, templateContext);
    return src;

  };

  return exports;
};

