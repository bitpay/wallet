/**
 * Small module for exporting data to CSV.
 */
var _ = require('lodash');
var preconditions = require('preconditions').singleton();
var moment = require('moment');

var logger = require('../util/log.js');
var config = require('../../config');


var COL_DELIMITER = ',';
var ROW_DELIMITER = '\r\n';

function getValue(obj, property) {
  if (_.isFunction(property)) {
    try { 
      return property(obj);
    } catch (err) {
      if (_.isString(err)) return err;
      return undefined;
    }
  }
  if (!_.isObject(obj)) return undefined;
  return obj.hasOwnProperty(property) ? obj[property] : undefined;
};

function formatValue(value, type, format) {
  if (_.isUndefined(value) || _.isNull(value)) return '';

  var r;
  switch (type) {
    default:
    case 'string':
      r = value.toString();
      r.replace('"', '\\"');
      break;
    case 'date':
      r = moment(value).format(format);
      break;
    case 'number':
      r = value.toString();
      break;
  }

  // escape when commas in values
  if (r.indexOf(',') !== -1) {
    r = '"' + r + '"';
  }
  return r;
};

function getHeader(descriptor) {
  return _.map(descriptor.columns, function (col) {
    return col.label || (_.isString(col.property) ? col.property : '') || '';
  });
};

function processDataRow(data, descriptor) {
  return _.map(descriptor.columns, function (col) {
    var value = getValue(data, col.property);
    var formatted = formatValue(value, col.type, col.format);
    return formatted;
  });
};

/**
 * @desc Convert json object to csv based on a descriptor
 *
 * @param {array} data - the array of json objects to convert to csv
 * @param {object} descriptor - an object that parameterizes the conversion
 * @param {function} cb - called with the resulting csv
 */
module.exports.toCsv = function(data, descriptor, cb) {
  preconditions.shouldBeArray(data);
  preconditions.shouldBeObject(descriptor);
  preconditions.shouldBeArray(descriptor.columns);
  preconditions.shouldBeFunction(cb);

  var colDelimiter = descriptor.colDelimiter || COL_DELIMITER;
  var rowDelimiter = descriptor.rowDelimiter || ROW_DELIMITER;

  var rows = _.map(data, function (dataRow) {
    return processDataRow(dataRow, descriptor);
  });

  var header = getHeader(descriptor);
  rows.unshift(header);

  var csv = _.reduce(rows, function (memo, row) {
    return memo + row.join(colDelimiter) + rowDelimiter;
  }, '');

  return cb(null, csv);
};
