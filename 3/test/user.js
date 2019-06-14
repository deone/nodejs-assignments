/* User Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const userTests = {}

// POST
userTests['POST /api/user should create user and return success message'] = done => {
  // User data
  const user = {
    email: 'c@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    password: '123456',
    streetAddress: 'Dansoman'
  }

  const payLoad = JSON.stringify(user)

  helpers.makeRequest('POST', '/api/user', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User created successfully.')

    // Delete user
    io.delete(dir.users)('c@a.com')

    done()
  })
}

// GET
userTests['GET /api/user should return user object'] = done => {
  // Create user
  const user = {
    email: 'd@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({})

  helpers.makeRequest('GET', '/api/user?email=d@a.com', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')

    // Delete user
    io.delete(dir.users)('d@a.com')

    done()
  })
}

// PUT
userTests['PUT /api/user should update user and return success message'] = done => {
  // Create user
  const user = {
    email: 'e@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({
    email: 'e@a.com',
    firstName: 'DDD',
    lastName: 'EEE',
    password: '123478',
    streetAddress: 'East Legon'
  })

  helpers.makeRequest('PUT', '/api/user', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User updated successfully.')

    // Delete user
    io.delete(dir.users)('e@a.com')

    done()
  })
}

// DELETE
userTests['DELETE /api/user should delete user and return success message'] = done => {
  // Create user
  const user = {
    email: 'f@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman'
  }

  io.writeUser(user)

  const payLoad = JSON.stringify({})

  helpers.makeRequest('DELETE', '/api/user?email=f@a.com', payLoad, '', (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User deleted successfully.')

    done()
  })
}


module.exports = userTests