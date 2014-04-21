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

