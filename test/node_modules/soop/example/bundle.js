require=
// modules are defined as an array
// [ module function, map of requireuires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the requireuire for previous bundles
(function outer (modules, cache, entry) {
    // Save the require from previous bundle to this closure if any
    var previousRequire = typeof require == "function" && require;

    function newRequire(name, jumped, inSkipCache){

        var m, skipCache = inSkipCache; 
        if (typeof name === 'string') {
          if (name.charAt(0) === '!' ) {
            name = name.substr(1);
            skipCache=true;
          }
        }
        if(skipCache || !cache[name]) {
            if(!modules[name]) {
                // if we cannot find the the module within our internal map or
                // cache jump to the current global require ie. the last bundle
                // that was added to the page.
                var currentRequire = typeof require == "function" && require;
                if (!jumped && currentRequire) return currentRequire(name, true);

                // If there are other bundles on this page the require from the
                // previous one is saved to 'previousRequire'. Repeat this as
                // many times as there are bundles until the module is found or
                // we exhaust the require chain.
                if (previousRequire) return previousRequire(name, true);
                throw new Error('Cannot find module \'' + name + '\'');
            }

            m = {exports:{}};
            var nextSkipCache = inSkipCache ? false : skipCache;
            if (!skipCache) cache[name] = m; 
            skipCache = false;
            modules[name][0].call(m.exports, function(x){
                var id = modules[name][1][x];
                return newRequire(id ? id : x, false, nextSkipCache);
            },m,m.exports,outer,modules,cache,entry);
        } 
        return m ? m.exports:cache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);

    // Override the current require with this new one
    return newRequire;
})
({"yi7t9z":[function(require,module,exports){
var imports = require('soop').imports();

function Coder() {
  Coder.super(this, arguments);
  this.favoriteLanguage = 'JavaScript';
};
Coder.parent = imports.parent || require('./Person');

Coder.prototype.name = function(aString) {
  if(!aString) return Coder.super(this, 'name', arguments);
  return Coder.super(this, 'name', [aString+'(coder)']);
};

module.exports = require('soop')(Coder);

},{"./Person":"PL+St2","soop":"WPvdJX"}],"Coder":[function(require,module,exports){
module.exports=require('yi7t9z');
},{}],"PL+St2":[function(require,module,exports){
(function (global){
var imports = require('soop').imports();
var Date = imports.Date || global.Date;
var console = imports.console || global.console;

function Person() {
  this._name = null;
  this.lastUpdate = Date.now();
};

Person.prototype.name = function(aString) {
  if(!aString) return this._name;
  this._name = aString;  
  this.lastUpdate = Date.now();
};

Person.prototype.print = function() {
  console.log('my name is: '+this.name()+
      ' (last updated '+this.lastUpdate+')');
};

module.exports = require('soop')(Person);


}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"soop":"WPvdJX"}],"./Person":[function(require,module,exports){
module.exports=require('PL+St2');
},{}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("/Users/ematiu/devel/node/node-soop/example/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/ematiu/devel/node/node-soop/example/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":5}],7:[function(require,module,exports){

module.exports = function(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
};

},{}],"WPvdJX":[function(require,module,exports){
(function (process,global){
var path = require('path');
var callsite = require('callsite');

// Decorate the given constructor with some useful
// object oriented constructs (mainly a convenient inherit()
// method and the ability to do a super send)
module.exports = function(constructor) {
  // inherit from the given constructor
  constructor.inherit = function(parent) {
    if (arguments.length > 1) {
      // this allows chaining multiple classes in the call
      parent.inherit(Array.prototype.slice.call(arguments, 1));
    }
    this.super_ = parent;
    this.prototype.__proto__ = parent.prototype;
    this.__proto__ = parent;
  };

  // invoke the given method of the parent
  constructor.super = function(receiver, method, args) {
    if (!this.super_) return;
    if (typeof method == 'string') {
      // invoke the named method
      return this.super_.prototype[method].apply(receiver, args);
    } else {
      // invoke the constructor of the parent
      return this.super_.apply(receiver, method);
    }
  };

  // a standarized way to access a cached default instance
  constructor.default = function() {
    if (!this._default) this._default = new this();
    return this._default;
  };

  // set the parent if one is specified
  if (constructor.parent) {
    constructor.inherit(constructor.parent);
  }

  return constructor;
};

// load the given module using the given imports
// @fname the module name (relative paths are relative to the caller's 
//        location in the file system
// @imports namespace for binding values in the loaded module
var load = function(fname, imports) {
  var callerFilename = callsite()[1].getFileName();
  fname = path.resolve(path.dirname(callerFilename), fname);
  fname = require.resolve(fname);
  var cachedModule = require.cache[fname];
  if (cachedModule) delete require.cache[fname];
  global._imports = imports;
  var answer = require(fname);
  delete require.cache[fname];
  if (cachedModule) require.cache[fname] = cachedModule;
  return answer;
};

var load_browser = function(fname, imports) {
  global._imports = imports;
  var answer;
  try {
    answer = require('!' + fname);
  } catch (e) {
    console.log('SOOP:' + e.message + '\nNote that SOOP requires a custom browserify configuration. please check soop\'s readme');
    throw e;
  }
  return answer;
};

module.exports.load = process.versions ? load : load_browser;

// access the imports passed from a call to load()
module.exports.imports = function() {
  var answer = global._imports || {};
  global._imports = {};
  return answer;
};

}).call(this,require("/Users/ematiu/devel/node/node-soop/example/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"/Users/ematiu/devel/node/node-soop/example/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":5,"callsite":7,"path":6}],"soop":[function(require,module,exports){
module.exports=require('WPvdJX');
},{}]},{},[])