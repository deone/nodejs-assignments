/* Order Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const orderTests = {}

// POST
orderTests['POST /api/order should order items in cart and return an array of orders'] = done => {
  // Create user
  const user = {
    email: 'j@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [{"name":"pepperoni","price":13.99}, {"name":"barbeque","price":17.79}]
  }

  io.writeUser(user)

  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('j@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  helpers.makeRequest('POST', '/api/order', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)
    assert.strictEqual(data.length, 1)

    // Delete order
    io.delete(dir.orders)(data[0]['orderId'])

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('j@a.com')

    done()
  })
}

// GET
orderTests['GET /api/order should return order object'] = done => {
  const orderId = '4qdf2sxbsy9ky89c3rs1'

  // Create user
  const user = {
    email: 'k@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    hashedPassword: crypto.hash('123456'),
    streetAddress: 'Dansoman',
    cart: [],
    orders: [
        {
            'orderId': orderId,
            'totalPrice': 17.99
        }
    ]
  }

  io.writeUser(user)

  // Create order
  const order = {
    id: orderId,
    totalPrice: 17.99,
    items: [
      {
        name: 'marinara',
        price: 17.99
      }
    ],
    email: 'k@a.com'
  }

  io.writeFile(dir.orders(orderId), JSON.stringify(order))

  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('k@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  helpers.makeRequest(
    'GET', '/api/order?id=4qdf2sxbsy9ky89c3rs1', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')

    // Delete order
    io.delete(dir.orders)(orderId)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('k@a.com')

    done()
  })
}


module.exports = orderTests