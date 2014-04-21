var B = require('../').Buffer
var test = require('tape')

test('new buffer from array', function (t) {
  t.equal(
    new B([1, 2, 3]).toString(),
    '\u0001\u0002\u0003'
  )
  t.end()
})

test('new buffer from string', function (t) {
  t.equal(
    new B('hey', 'utf8').toString(),
    'hey'
  )
  t.end()
})

test('new buffer from buffer', function (t) {
  var b1 = new B('asdf')
  var b2 = new B(b1)
  t.equal(b1.toString('hex'), b2.toString('hex'))
  t.end()
})

test('new buffer from uint8array', function (t) {
  if (typeof Uint8Array !== 'undefined') {
    var b1 = new Uint8Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from uint16array', function (t) {
  if (typeof Uint16Array !== 'undefined') {
    var b1 = new Uint16Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from uint32array', function (t) {
  if (typeof Uint32Array !== 'undefined') {
    var b1 = new Uint32Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from int16array', function (t) {
  if (typeof Int16Array !== 'undefined') {
    var b1 = new Int16Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from int32array', function (t) {
  if (typeof Int32Array !== 'undefined') {
    var b1 = new Int32Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from float32array', function (t) {
  if (typeof Float32Array !== 'undefined') {
    var b1 = new Float32Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('new buffer from float64array', function (t) {
  if (typeof Float64Array !== 'undefined') {
    var b1 = new Float64Array([0, 1, 2, 3])
    var b2 = new B(b1)
    t.equal(b1.length, b2.length)
    t.equal(b1[0], 0)
    t.equal(b1[1], 1)
    t.equal(b1[2], 2)
    t.equal(b1[3], 3)
    t.equal(b1[4], undefined)
  }
  t.end()
})

test('buffer toArrayBuffer()', function (t) {
  var data = [1, 2, 3, 4, 5, 6, 7, 8]
  if (typeof Uint8Array !== 'undefined') {
    var result = new B(data).toArrayBuffer()
    var expected = new Uint8Array(data).buffer
    for (var i = 0; i < expected.byteLength; i++) {
      t.equal(result[i], expected[i])
    }
  } else {
    t.pass('No toArrayBuffer() method provided in old browsers')
  }
  t.end()
})

test('buffer toJSON()', function (t) {
  var data = [1, 2, 3, 4]
  t.deepEqual(
    new B(data).toJSON(),
    { type: 'Buffer', data: [1,2,3,4] }
  )
  t.end()
})

test('buffer copy example', function (t) {
  var buf1 = new B(26)
  var buf2 = new B(26)

  for (var i = 0 ; i < 26 ; i++) {
    buf1[i] = i + 97; // 97 is ASCII a
    buf2[i] = 33; // ASCII !
  }

  buf1.copy(buf2, 8, 16, 20)

  t.equal(
    buf2.toString('ascii', 0, 25),
    '!!!!!!!!qrst!!!!!!!!!!!!!'
  )
  t.end()
})
