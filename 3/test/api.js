/*
 * API Tests
 *
 */

// Dependencies
const app = require('./../index')
const assert = require('assert')
const http = require('http')
const config = require('./../lib/config')

const { io, dir, crypto } = require('./../lib/utils')

const user = {
  email: 'a@a.com',
  lastName: 'BBB',
  firstName: 'CCC',
  hashedPassword: crypto.hash("123456"),
  streetAddress: 'Dansoman'
}

const makeGETRequest = (path, callBack) => {
  // Configure options
  const options = {
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
  const req = http.request(options, res => callBack(res))

  req.end()
}

const makePOSTRequest = (path, data, token, callBack) => {
  const options = {
    'protocol': 'http:',
    'hostname': 'localhost',
    'port': config.port,
    'method': 'POST',
    'path': '/api/login',
    'headers': {
      'token': token,
      'Content-Type' : 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }

  const req = http.request(options, res => {
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => callBack(JSON.parse(body)))
  })

  req.on('error', error => console.error(error))

  req.write(data)
  req.end()
}

// Holder for Tests
const api = {}

// Make a request to a random path
api['A random path should respond to GET with 404'] = done => {
  makeGETRequest('/this/path/shouldnt/exist', response => {
    assert.equal(response.statusCode, 404)
    done()
  })
}

api['/api/login should return token object'] = done => {
  // Create user
  io.writeUser(user)

  const data = JSON.stringify({
    "email": "a@a.com",
    "password": "123456"
  })

  // Log in
  makePOSTRequest('/api/login', data, null, res => {
    assert.equal(res.email, 'a@a.com')

    // Delete user
    io.delete(dir.users)('a@a.com')

    done()
  })
}


// Export the tests to the runner
module.exports = api