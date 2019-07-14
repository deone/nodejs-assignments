/* Checkout Tests */

const app = require('./../index')
const assert = require('assert')

const { io, dir, crypto } = require('./../lib/utils')
const helpers = require('./helpers')

// Holder for Tests
const checkoutTests = {}

// POST
checkoutTests['POST /api/checkout should send email, payment and return success message'] = done => {
  const orderId = '4qdf2sxbsy9ky89c3rs2'

  // Create user
  const user = {
    email: 'l@a.com',
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
    email: 'l@a.com'
  }

  io.writeFile(dir.orders(orderId), JSON.stringify(order))

  // Create token
  const token = crypto.createToken('l@a.com')(crypto.createRandomString(20))

  // Write token
  io.writeToken(token)

  const payLoad = JSON.stringify({
    'orderId': orderId
  })

  helpers.makeRequest(
    'POST', '/api/checkout', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'Payment processed and user notified successfully.')

    // Delete order
    io.delete(dir.orders)(orderId)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('l@a.com')

    done()
  })
}


module.exports = checkoutTests 