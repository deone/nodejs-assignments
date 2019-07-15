/* Cart Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const cartTests = {}

// GET
cartTests["GET /api/cart should return an array of items in user's cart"] = done => {
  // Create user
  const user = {
    email: 'g@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [{"name":"pepperoni","price":13.99}]
  }

  io.writeUser(user)

  // Create token
  const token = crypto.createToken('g@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payload = JSON.stringify({})

  helpers.makeRequest('GET', '/api/cart', payload, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('g@a.com')

    done()
  })
}

// GET - Token expired
cartTests['GET /api/cart with expired token should return error message'] = done => {
  // Create user
  const user = {
    email: 'p@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [{"name":"pepperoni","price":13.99}]
  }

  io.writeUser(user)

  // Create token
  const token = crypto.createToken('p@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  // Expire token
  token.expires = token.expires - (2000 * 60 * 60)
  // Write to disk
  io.writeFile(dir.tokens(token.id), JSON.stringify(token))

  const payload = JSON.stringify({})

  helpers.makeRequest('GET', '/api/cart', payload, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 401)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], 'Token has expired. Please login again.')

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('p@a.com')

    done()
  })
}

// PUT
cartTests["PUT /api/cart should update and return user's cart"] = done => {
  // Create user
  const user = {
    email: 'h@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [{"name":"pepperoni","price":13.99}]
  }

  io.writeUser(user)

  // Create token
  const token = crypto.createToken('h@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payload = JSON.stringify({
    "item": "barbeque"
  })

  helpers.makeRequest('PUT', '/api/cart', payload, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)
    assert.strictEqual(data.length, 2)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('h@a.com')

    done()
  })
}

// DELETE
cartTests["DELETE /api/cart should delete item and return user's cart"] = done => {
  // Create user
  const user = {
    email: 'i@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [{"name":"pepperoni","price":13.99}, {"name":"barbeque","price":17.79}]
  }

  io.writeUser(user)

  // Create token
  const token = crypto.createToken('i@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payload = JSON.stringify({})

  helpers.makeRequest('DELETE', '/api/cart?item=barbeque', payload, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)
    assert.strictEqual(data.length, 1)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('i@a.com')

    done()
  })
}


module.exports = cartTests 