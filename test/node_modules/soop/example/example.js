var load = require('soop').load;

// basic example
var Person = require('./Person');
var me = new Person();
me.name('John');
me.print();

// example use of a default instance
Person.default().name('Jeff(default)');
Person.default().print();

// now let's use a substitute for Date
var MockDate = {
  now: function() {return 'a split second ago'}
};
var Person = load('./Person', {Date: MockDate});
var me = new Person();
me.name('Jack');
me.print();

// an example employing inheritance
var Coder = require('./Coder');
var coder = new Coder();
coder.name('Jennifer');
coder.print();
