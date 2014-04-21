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
