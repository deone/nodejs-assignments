/*
 * Unit Tests
 *
 */

// Dependencies
var assert = require('assert')
const { getANumber } = require('./../lib/utils')

// Holder for Tests
var unit = {};

// Assert that the getANumber function is returning a number
unit['helpers.getANumber should return a number'] = function(done){
  var val = getANumber();
  assert.equal(typeof(val), 'number');
  done();
};

// Assert that the getANumber function is returning 1
unit['helpers.getANumber should return 1'] = function(done){
  var val = getANumber();
  assert.equal(val, 1);
  done();
};

// Assert that the getANumber function is returning 2
unit['helpers.getNumberOne should return 2'] = function(done){
  var val = getANumber();
  assert.equal(val, 2);
  done();
};


module.exports = unit