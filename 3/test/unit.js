/*
 * Unit Tests
 *
 */

// Dependencies
const assert = require('assert')
const { getANumber } = require('./../lib/utils')

// Holder for Tests
const unit = {}

// Assert that the getANumber function is returning a number
unit['helpers.getANumber should return a number'] = done => {
  const val = getANumber()
  assert.equal(typeof val, 'number')
  done()
}

// Assert that the getANumber function is returning 1
unit['helpers.getANumber should return 1'] = done => {
  const val = getANumber()
  assert.equal(val, 1)
  done()
}

// Assert that the getANumber function is returning 2
unit['helpers.getNumberOne should return 2'] = done => {
  const val = getANumber()
  assert.equal(val, 2)
  done()
}


module.exports = unit