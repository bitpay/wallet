'use strict';

var grunt = require('grunt');
var markdown = require('../tasks/lib/markdown').init(grunt);
var cheerio = require('cheerio');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var filepath = 'test/samples/javascript.md';
var file = null;
var defaultFile =  grunt.file.read(filepath);
var templatepath = 'tasks/template.html';
var template = null;
var defaultTemplate = grunt.file.read(templatepath);
var html = null;
var $result = null;
var noop = function() {};
var options = null;

function getjQuery() {
  html = markdown.markdown(file, options, template);
  $result = cheerio(html);
}

exports['markdown'] = {
  setUp: function(done) {
    options = {
      preCompile: noop,
      postCompile: noop,
      templateContext: {},
        markdownOptions: {
            gfm: true,
            highlight: 'manual'
        }
    };
    template = defaultTemplate;
    file = defaultFile;
    done();
  },
  tearDown: function(done) {
    done();
  },
  'helper': function(test) {
    getjQuery();
    test.ok($result.find('body').length === 1, 'should have body');
    test.done();
  },
  'basic code highlight': function(test) {
    getjQuery();
    test.ok($result.find('code.lang-javascript').length === 1, 'should have 1 js code block');
    test.ok($result.find('code.lang-json').length === 1, 'should have 1 json code block');
    test.done();

  },
  'hjs code hightlight': function(test) {
    getjQuery();
    test.ok($result.find('body').length === 1, 'should have body');
    test.done();

  },
  'should have header': function(test) {
    getjQuery();
    test.ok($result.find('h1').length === 1, 'should have h1');
    test.done();

  },
  'should have header text': function(test) {
    getjQuery();
    test.ok($result.find('h1').text() === 'This is a test of GFM for javascript', 'should have proper text');
    test.done();

  },
  'should have one list': function(test) {
    getjQuery();
    test.ok($result.find('ul li').length === 2, 'should have 2 items in the list');
    test.done();

  },
  'should have a link': function(test) {
    getjQuery();
    var $a = $result.find('a');
    test.ok($a.text() === 'markdown', 'should have link text');
    test.ok($a.attr('href') === 'http://daringfireball.net/projects/markdown/syntax', 'should have link target');
    test.done();

  },

  'should have inline code': function(test) {
    getjQuery();
    var $a = $result.find('p code');
    test.ok($a.text() === 'json', 'should have code text');
    test.done();

  },

  'should expand preCompile context': function(test) {
    template = grunt.file.read('test/data/titletest.html');
    file = grunt.file.read('test/data/titletest.md');

    options.preCompile = function(src, context) {
      var matcher = src.match(/@-title:\s?([^@:\n]+)\n/i);
      context.title = matcher && matcher.length > 1 && matcher[1];
      matcher = src.match(/@-description:\s?([^@:\n]+)\n/i);
      context.description = matcher && matcher.length > 1 && matcher[1];
    };
    getjQuery();
    var $title = $result.find('title');
    var $desc = $result.find('meta[name="description"]');

    test.ok($title.text() === 'The name is this', 'the title should be set from preCompile context');
    test.ok($desc.attr('content') === 'Monkey', 'the description should be set from preCompile context');
    test.done();
  },

  'should save postCompile Changes': function(test) {
    options.postCompile = function(src, context) {
      return '<div><h1>Oh Hai</h1></div>';
    };

    getjQuery();
    var $h1 = $result.find('h1');
    test.ok($h1.text() === 'Oh Hai', 'the content is replaced with postCompile changes');
    test.done();
  },
  'should expand template with context object': function(test) {
    template = grunt.file.read('test/data/titletest.html');
    file = grunt.file.read('test/data/titletest.md');

    options.templateContext = {
      title: 'The name is this',
      description: 'Monkey'
    };
    getjQuery();
    var $title = $result.find('title');
    var $desc = $result.find('meta[name="description"]');

    test.ok($title.text() === 'The name is this', 'the title should be set from preCompile context');
    test.ok($desc.attr('content') === 'Monkey', 'the description should be set from preCompile context');
    test.done();

  },
  'should expand template with context from function': function(test) {
    template = grunt.file.read('test/data/titletest.html');
    file = grunt.file.read('test/data/titletest.md');

    options.templateContext = function() {

      return {
        title: 'The name is this',
        description: 'Monkey'
      };

    };

    getjQuery();
    var $title = $result.find('title');
    var $desc = $result.find('meta[name="description"]');

    test.ok($title.text() === 'The name is this', 'the title should be set from preCompile context');
    test.ok($desc.attr('content') === 'Monkey', 'the description should be set from preCompile context');
    test.done();

  }

};
