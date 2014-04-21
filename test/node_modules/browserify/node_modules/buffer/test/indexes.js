var B = require('../').Buffer
var test = require('tape')

test('indexes from a string', function(t) {
  var buf = new B('abc')
  t.equal(buf[0], 97)
  t.equal(buf[1], 98)
  t.equal(buf[2], 99)
  t.end()
})

test('indexes from an array', function(t) {
  var buf = new B([ 97, 98, 99 ])
  t.equal(buf[0], 97)
  t.equal(buf[1], 98)
  t.equal(buf[2], 99)
  t.end()
})

test('set then modify indexes from an array', function(t) {
  var buf = new B([ 97, 98, 99 ])
  t.equal(buf[2], 99)
  t.equal(buf.toString(), 'abc')

  buf[2] += 10
  t.equal(buf[2], 109)
  t.equal(buf.toString(), 'abm')
  t.end()
})
