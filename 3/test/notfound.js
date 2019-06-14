/* NotFound test */

const app = require('./../index')
const assert = require('assert')

const helpers = require('./helpers')

// Holder for Tests
const notFoundTests = {}

// Not Found
notFoundTests['A random path should respond to GET with 404'] = done => {
  const payLoad = JSON.stringify({})
  helpers.makeRequest(
    'GET', '/this/path/shouldnt/exist', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 404)
    done()
  })
}


module.exports = notFoundTests