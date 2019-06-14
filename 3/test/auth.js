/* Auth Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const authTests = {}

// auth.js
// POST login
authTests['/api/login should return token object'] = done => {
  // Create user
  const user = {
    email: 'a@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({
    "email": "a@a.com",
    "password": "123456"
  })

  // Log in
  helpers.makeRequest('POST', '/api/login', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data.email, 'a@a.com')
    assert.strictEqual(typeof data.id, 'string')
    assert.strictEqual(typeof data.expires, 'number')

    // Delete user
    io.delete(dir.users)('a@a.com')

    // Delete token
    io.delete(dir.tokens)(data.id)

    done()
  })
}

// Missing required fields
authTests['/api/login should return error message'] = done => {
  // Create user
  const user = {
    email: 'm@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({
    "password": "123456"
  })

  // Log in
  helpers.makeRequest('POST', '/api/login', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 400)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], 'Missing required fields.')

    // Delete user
    io.delete(dir.users)('m@a.com')

    // Delete token
    io.delete(dir.tokens)(data.id)

    done()
  })
}

// Wrong password

// User does not exist


// POST logout
authTests['/api/logout should return success message'] = done => {
  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('a@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  // Log in
  helpers.makeRequest('POST', '/api/logout', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User logged out.')

    done()
  })
}


module.exports = authTests