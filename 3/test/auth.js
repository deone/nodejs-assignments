/* Auth Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const authTests = {}

// auth.js
// POST login
authTests['POST /api/login should return token object'] = done => {
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
  helpers.makeRequest('POST', '/api/login', payLoad, '', (statusCode, data) => {
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
authTests['POST /api/login with a missing field should return error message'] = done => {
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
  helpers.makeRequest('POST', '/api/login', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 400)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], 'Missing required field(s).')

    // Delete user
    io.delete(dir.users)('m@a.com')

    done()
  })
}

// Wrong password
authTests['POST /api/login with wrong password should return error message'] = done => {
  // Create user
  const user = {
    email: 'n@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({
    "email": "n@a.com",
    "password": "123457"
  })

  // Log in
  helpers.makeRequest('POST', '/api/login', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 400)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], "Password did not match the user's stored password.")

    // Delete user
    io.delete(dir.users)('n@a.com')

    done()
  })
}

// User does not exist
authTests['POST /api/login with non-existent credentials should return error message'] = done => {
  // Attempt logging in with credentials that
  // don't exist
  const payLoad = JSON.stringify({
    "email": "o@a.com",
    "password": "123457"
  })

  // Log in
  helpers.makeRequest('POST', '/api/login', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 404)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], 'User does not exist.')

    done()
  })
}


// POST logout
authTests['POST /api/logout should return success message'] = done => {
  // Create token
  const token = crypto.createToken('a@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payLoad = JSON.stringify({})

  // Log in
  helpers.makeRequest('POST', '/api/logout', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User logged out.')

    done()
  })
}

// Token not provided
authTests['POST /api/logout without token should return error message'] = done => {
  const payLoad = JSON.stringify({})

  // Log in
  helpers.makeRequest('POST', '/api/logout', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 401)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Error'], 'Authentication token not provided.')

    done()
  })
}


module.exports = authTests