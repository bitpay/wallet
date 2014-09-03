var config = require('../config');

var Logger = function(name) {
  this.name = name || 'log';
  this.level = 2;
};

var levels = {
  'debug': 0,
  'info': 1,
  'log': 2,
  'warn': 3,
  'error': 4,
  'fatal': 5
};

Object.keys(levels).forEach(function(level) {
  Logger.prototype[level] = function() {
    if (levels[level] >= levels[this.level]) {
      var str = '[' + level + '] ' + this.name + ': ' + arguments[0],
        extraArgs,
      extraArgs = [].slice.call(arguments, 1);
      if (console[level]) {
        extraArgs.unshift(str);
        console[level].apply(console, extraArgs);
      } else {
        if (extraArgs.length) {
          str += JSON.stringify(extraArgs);
        }
        console.log(str);
      }
    }
  };
});

Logger.prototype.setLevel = function(level) {
  this.level = level;
}

var logger = new Logger('copay');
logger.setLevel(config.logLevel);

module.exports = logger;
