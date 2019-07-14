/*
 * Unit Tests
 *
 */

// Dependencies
const path = require('path')
const assert = require('assert')
const {
  io,
  dir,
  validate,
  json,
  crypto,
  request
} = require('./../lib/utils')

// These first 2 test cases need not exist
// Remove them

const user = {
  email: 'a@a.com',
  lastName: 'BBB',
  firstName: 'CCC',
  password: '123456',
  streetAddress: 'Dansoman'
}

// Holder for Tests
const unit = {}

unit['dir.path should return a directory path'] = done => {
  // Get path to user directory
  const val = dir.path(path.join(__dirname, '/../.data/'))('users')()
  assert.strictEqual(val, `${path.join(__dirname, '/../.data/')}users/`)

  done()
}

unit['dir.path should return a file path'] = done => {
  // Write user
  io.writeUser(user)

  // Get path to user file
  const val = dir.path(
    path.join(__dirname, '/../.data/'))('users')('a@a.com')
  assert.strictEqual(val,
    `${path.join(__dirname, '/../.data/')}users/a@a.com.json`)

  io.delete(dir.users)('a@a.com')

  done()
}

unit['validate should return false for empty strings and trimmed strings for strings in a given array'] = done => {
  const val = validate(['', ' hello'])

  assert.strictEqual(val[0], false)
  assert.strictEqual(val[1], 'hello')

  done()
}

unit['json.toObject should return a JSON object'] = done => {
  const val = json.toObject('{"firstName":"A","lastName":"B","email":"a@gmail.com"}')
  assert.strictEqual(typeof val, 'object')
  assert.strictEqual(val.firstName, "A")

  done()
}

unit['json.toObject should return an empty object'] = done => {
  const val = json.toObject("firstName")
  assert.strictEqual(typeof val, 'object')
  assert.strictEqual(Object.entries(val).length, 0)

  done()
}

unit['crypto.createRandomString should return an 8 char long string'] = done => {
  const val = crypto.createRandomString(8)
  assert.strictEqual(typeof val, 'string')
  assert.strictEqual(val.length, 8)

  done()
}

unit['crypto.createToken should return object containing 20 char long string'] = done => {
  // Create token
  const token = crypto.createToken('a@a.com')('l3j6d7qo90zp2k0wyqbx')

  assert.strictEqual(typeof token, 'object')
  assert.strictEqual(token.id.length, 20)

  done()
}

unit['crypto.hash should return a string'] = done => {
  const val = crypto.hash('xxx')
  assert.strictEqual(typeof val, 'string')
  assert.strictEqual(val.length, 64)

  done()
}

// request tests
// request.setOptions
unit['request.setOptions should return object'] = done => {
  // Create token
  const token = crypto.createToken('a@a.com')('l3j6d7qo90zp2k0wyqby')

  // Create order
  const order = {
    id: '4qdf2sxbsy9ky89c3rs2',
    totalPrice: 17.99,
    items: [ { name: 'marinara', price: 17.99 } ],
    email: 'a@a.com'
  }

  const payload = request.createPayload(token)(order)('opennode')
  const options = request.setOptions(payload)

  assert.strictEqual(typeof options, 'object')

  done()
}

// request.createPayload
unit['request.createPayload should return string'] = done => {
  // Create token
  const token = crypto.createToken('a@a.com')('l3j6d7qo90zp2k0wyqby')

  // Create order
  const order = {
    id: '4qdf2sxbsy9ky89c3rs2',
    totalPrice: 17.99,
    items: [ { name: 'marinara', price: 17.99 } ],
    email: 'a@a.com'
  }

  const payload = request.createPayload(token)(order)('stripe')
  assert.strictEqual(typeof payload, 'string')

  done()
}
// request.dispatch


module.exports = unit