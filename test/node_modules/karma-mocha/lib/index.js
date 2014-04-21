var path = require('path');

var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var initMocha = function(files) {
  var mochaPath = path.dirname(require.resolve('mocha'));
  files.unshift(createPattern(__dirname + '/adapter.js'));
  files.unshift(createPattern(mochaPath + '/mocha.js'));
};

initMocha.$inject = ['config.files'];

module.exports = {
  'framework:mocha': ['factory', initMocha]
};
