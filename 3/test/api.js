/*
 * API Tests
 *
 */

// Dependencies
const app = require('./../index')
const assert = require('assert')
const http = require('http')
const config = require('./../lib/config')

const makeGetRequest = (path, callback) => {
  // Configure the request details
  const requestDetails = {
    'protocol': 'http:',
    'hostname': 'localhost',
    'port': config.port,
    'method': 'GET',
    'path': path,
    'headers': {
      'Content-Type' : 'application/json'
    }
  }

  // Send the request
  const req = http.request(requestDetails, res => callback(res))

  req.end()
}

// Holder for Tests
const api = {}

// Make a request to a random path
api['A random path should respond to GET with 404'] = done => {
  makeGetRequest('/this/path/shouldnt/exist', res => {
    assert.equal(res.statusCode, 404)
    done()
  })
}

// Export the tests to the runner
module.exports = api