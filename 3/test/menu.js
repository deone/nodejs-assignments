/* Menu Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const menuTests = {}

// GET
menuTests['GET /api/menu should return array of menu items'] = done => {
  // Create token
  const token = crypto.createToken('b@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payLoad = JSON.stringify({})

  helpers.makeRequest('GET', '/api/menu', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)

    // Delete token
    io.delete(dir.tokens)(token.id)

    done()
  })
}


module.exports = menuTests