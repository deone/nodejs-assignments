/*
 * API Tests
 *
 */

// Dependencies
const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')


// Holder for Tests
const api = {}

// Not Found
api['A random path should respond to GET with 404'] = done => {
  const data = JSON.stringify({})
  helpers.makeRequest(
    'GET', '/this/path/shouldnt/exist', data, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 404)
    done()
  })
}


// auth.js
// POST login
api['/api/login should return token object'] = done => {
  // Create user
  const user = {
    email: 'a@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }
  io.writeUser(user)

  const data = JSON.stringify({
    "email": "a@a.com",
    "password": "123456"
  })

  // Log in
  helpers.makeRequest('POST', '/api/login', data, null, (statusCode, data) => {
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

// POST logout
api['/api/logout should return success message'] = done => {
  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('a@a.com')(crypto.createRandomString(20))

  const data = JSON.stringify({})

  // Log in
  helpers.makeRequest('POST', '/api/logout', data, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User logged out.')

    done()
  })
}


// menu.js
// GET
api['GET /api/menu should return array of menu items'] = done => {
  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('a@a.com')(crypto.createRandomString(20))

  const data = JSON.stringify({})

  helpers.makeRequest('GET', '/api/menu', data, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)

    // Delete token
    io.delete(dir.tokens)(token.id)

    done()
  })
}


// user.js
// POST
api['POST /api/user should create user and return success message'] = done => {
  // User data
  const user = {
    email: 'b@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    password: '123456',
    streetAddress: 'Dansoman'
  }

  const data = JSON.stringify(user)

  helpers.makeRequest('POST', '/api/user', data, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User created successfully.')

    // Delete user
    io.delete(dir.users)('b@a.com')

    done()
  })
}

// GET
api['GET /api/user should return user object'] = done => {
  // Create user
  const user = {
    email: 'c@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const data = JSON.stringify({})

  helpers.makeRequest('GET', '/api/user?email=c@a.com', data, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')

    // Delete user
    io.delete(dir.users)('c@a.com')

    done()
  })
}

// PUT
api['PUT /api/user should update user and return success message'] = done => {
  // Create user
  const user = {
    email: 'd@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const data = JSON.stringify({
    email: 'd@a.com',
    firstName: 'DDD',
    lastName: 'EEE',
    password: '123478',
    streetAddress: 'East Legon'
  })

  helpers.makeRequest('PUT', '/api/user', data, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')

    // Delete user
    io.delete(dir.users)('d@a.com')

    done()
  })

}

// DELETE
api['DELETE /api/user should delete user and return success message'] = done => {
  done()
}


// Export the tests to the runner
module.exports = api