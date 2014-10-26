'use strict';

// 83.8% typed (by google's closure-compiler account)

var preconditions = require('preconditions').singleton();
var HDPath = require('./HDPath');
var _ = require('lodash');

/**
 * @desc
 * HDParams is a class that encapsulates information about the current indexes
 * of a copayer
 *
 * When a copayer creates a new wallet, his receiveIndex gets updated, and an
 * address is generated from everybody's public key, using this BIP32 path:
 * <pre> m/copay'/{copayer}/0/{index} </pre>
 *
 * When a copayer generates a transaction proposal, his changeIndex gets
 * updated, and all funds from that transaction proposal go to the multisig
 * address generated from this BIP32 path for all the copayers:
 * <pre> m/copay'/{copayer}/1/{changeIndex} </pre>
 *
 * There's a shared index, <tt>HDPath.SHARED_INDEX</tt>, that serves to
 * generate addresses common to everybody.
 *
 * @TODO: Should opts.cosigner go?
 *
 * @constructor
 *
 * @param {Object} opts - options for the construction of this object
 * @param {number=} opts.cosigner - backwards compatible index of a copayer
 * @param {number} opts.copayerIndex - the copayer that generated this branch
 * of addresses
 * @param {number} opts.receiveIndex - the current index for a the last receive
 * address generated for this copayer
 * @param {number} opts.changeIndex - the current index for a the last change
 * address generated for this copayer
 */
function HDParams(opts) {
  opts = opts || {};

  //opts.cosigner is for backwards compatibility only

  /**
   * @public
   * @type number
   */
  this.copayerIndex = _.isUndefined(opts.copayerIndex) ?  opts.cosigner : opts.copayerIndex;
  /**
   * @public
   * @type number
   */
  this.changeIndex = opts.changeIndex || 0;
  /**
   * @public
   * @type number
   */
  this.receiveIndex = opts.receiveIndex || 0;

  if (_.isUndefined(this.copayerIndex)) {
    this.copayerIndex = HDPath.SHARED_INDEX;
  }
}

/**
 * @desc
 * Creates a set of HDParams, with one HDParams structure for each copayer and
 * a shared path.
 *
 * @static
 * @param {number} totalCopayers - the number of copayers in a wallet
 * @returns {HDParams[]} a list of HDParams generated for a new empty wallet
 */
HDParams.init = function(totalCopayers) {
  preconditions.shouldBeNumber(totalCopayers);

  var ret = [new HDParams({receiveIndex: 1})];
  for (var i = 0 ; i < totalCopayers ; i++) {
    ret.push(new HDParams({copayerIndex: i}));
  }
  return ret;
};

/**
 * @desc
 * Generates a set of HDParams from a list with a object-serialized version of
 * HDParams.
 *
 * @static
 * @param {Object[]} hdParams - a list with objects
 * @returns {HDParams[]} builds a HDParams for each object literal found in the list
 */
HDParams.fromList = function(hdParams) {
  return hdParams.map(function(i) { return HDParams.fromObj(i); });
};

/**
 * @desc
 * Generate a HDParams from an object.
 * 
 * This essentialy only calls new HDParams(data), but it's the interface being
 * used everywhere to encode/decode.
 *
 * @TODO: This should be clarified - Or abstracted away - as it's a pattern
 * used in multiple places.
 * 
 * @static 
 * @param {Object} data - a serialized version of HDParams
 * @return {HDParams}
 * @throws {BADDATA} - when the parameter <tt>data</tt> already is an instance of
 *                     HDParams.
 */
HDParams.fromObj = function(data) {
  if (data instanceof HDParams) {
    throw new Error('BADDATA', 'bad data format: Did you use .toObj()?');
  }
  return new HDParams(data);
};

/**
 * @desc
 * Serializes a list of HDParams to a list of "plain" objects, according to each
 * element's <tt>toObj()</tt> method.
 *
 * @TODO: There should be a list of Classes that share this behaviour.
 * 
 * @static
 * @param {HDParams[]} hdParams - a list of HDParams objects.
 * @returns {Array} an array with the <tt>toObj()</tt> serialization of each
 *                  element in hdParams
 */
HDParams.serialize = function(hdParams) {
  return hdParams.map(function(i) { return i.toObj(); });
};

/**
 * @desc
 * Creates a new HDParams set with <tt>totalCopayers+1</tt> elements.
 *
 * Sets the first (corresponding to the parameters for the shared addresses)
 * HDParams object to match <tt>shared</tt>'s values. Returns a serialized
 * version of this set
 *
 * <pre>
 * var updateResult = HDParams.update({changeIndex: 1, receiveIndex: 2}, 5);
 * // All the following asserts succeed
 * assert(_.isArray(updateResult));
 * assert(_.all(updateResult, function (hd) { return !(hd instanceOf HDParams); }));
 * assert(_.size(updateResult) === 6);
 * assert(updateResult[0].changeIndex === 1);
 * assert(updateResult[0].receiveIndex === 2);
 * </pre>
 *
 * @TODO: This method is badly coded, it does something that is very specific
 *        and kind of strange. I couldn't figure out why would it be needed.
 *
 * @static
 * @param {HDParams} shared - an instance of HDParams
 * @param {number} totalCopayers
 * @return {Object[]}
 */
HDParams.update = function(shared, totalCopayers) {
  var hdParams = this.init(totalCopayers);
  hdParams[0].changeIndex = shared.changeIndex;
  hdParams[0].receiveIndex = shared.receiveIndex;
  return this.serialize(hdParams);
};

/**
 * @desc
 * Serializes this object
 *
 * @TODO: I couldn't realize why would this be needed - calling, for example,
 * JSON.stringify would have the same result on this object than on the
 * original instance
 *
 * @returns {Object} a serialized version that should be equal (in a deep object
 *                   comparison) to the <tt>this</tt> instance if passed to the
 *                   <tt>HDParams()</tt> constructor.
 */
HDParams.prototype.toObj = function() {
  return {
    copayerIndex: this.copayerIndex,
    changeIndex: this.changeIndex,
    receiveIndex: this.receiveIndex
  };
};

/**
 * @desc
 * Throws an error if a given index falls out of the range for known addresses.
 *
 * @TODO: This is not a good pattern, exceptions should be for exceptional things.
 *
 * @param {number} index the index to check for
 * @param {boolean} isChange whether to check for the change index or the
 *                           receive address index
 */
HDParams.prototype.checkRange = function(index, isChange) {
  if ((isChange && index > this.changeIndex) ||
      (!isChange && index > this.receiveIndex)) {
    throw new Error('Out of bounds at index ' + index + ' isChange: ' + isChange);
  }
};

/**
 * @desc
 * Return this instance's changeIndex value
 *
 * @TODO: Somebody did a lot of java. Not sure if we need to be so verbose. If
 * anything, let's just declare changeIndex as a read only variable
 * @returns {number} this HDParams current index to generate a change address
 */
HDParams.prototype.getChangeIndex = function() {
  return this.changeIndex;
};

/**
 * @desc
 * Return this instance's receiveIndex value
 *
 * @TODO: Somebody did a lot of java. Not sure if we need to be so verbose. If
 * anything, let's just declare changeIndex as a read only variable
 * @returns {number} this HDParams current index to generate a receive address
 */
HDParams.prototype.getReceiveIndex = function() {
  return this.receiveIndex;
};

/**
 * @desc
 * Increment this instance's changeIndex or receiveIndex value
 *
 * @TODO: Somebody did a lot of java. Not sure if we need to be so verbose.
 *
 * @param {boolean} isChange - if true, change <tt>changeIndex</tt>
 */
HDParams.prototype.increment = function(isChange) {
  if (isChange) {
    this.changeIndex++;
  } else {
    this.receiveIndex++;
  }
};

/**
 * @desc
 * Merge this instance with another HDParams instance.
 *
 * @TODO: Device a general approach to merges.
 *
 * @param {Object} inHDParams - the object to merge to
 * @param {number} inHDParams.copayerIndex - the object to merge to
 * @returns {boolean} true if this object has changed
 */
HDParams.prototype.merge = function(inHDParams) {
  preconditions.shouldBeObject(inHDParams);
  preconditions.checkArgument(this.copayerIndex == inHDParams.copayerIndex);

  var hasChanged = false;

  if (inHDParams.changeIndex > this.changeIndex) {
    this.changeIndex = inHDParams.changeIndex;
    hasChanged = true;
  }

  if (inHDParams.receiveIndex > this.receiveIndex) {
    this.receiveIndex = inHDParams.receiveIndex;
    hasChanged = true;
  }
  return hasChanged;
};

module.exports = HDParams;
