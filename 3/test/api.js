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


// POST logout
api['/api/logout should return success message'] = done => {
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


// menu.js
// GET
api['GET /api/menu should return array of menu items'] = done => {
  // Create token
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('b@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  helpers.makeRequest('GET', '/api/menu', payLoad, token.id, (statusCode, data) => {
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
    email: 'c@a.com',
    lastName: 'BBB',
    firstName: 'CCC',
    password: '123456',
    streetAddress: 'Dansoman'
  }

  const payLoad = JSON.stringify(user)

  helpers.makeRequest('POST', '/api/user', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User created successfully.')

    // Delete user
    io.delete(dir.users)('c@a.com')

    done()
  })
}

// GET
api['GET /api/user should return user object'] = done => {
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

  helpers.makeRequest('GET', '/api/user?email=d@a.com', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')

    // Delete user
    io.delete(dir.users)('d@a.com')

    done()
  })
}

// PUT
api['PUT /api/user should update user and return success message'] = done => {
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

  helpers.makeRequest('PUT', '/api/user', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User updated successfully.')

    // Delete user
    io.delete(dir.users)('e@a.com')

    done()
  })
}

// DELETE
api['DELETE /api/user should delete user and return success message'] = done => {
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

  helpers.makeRequest('DELETE', '/api/user?email=f@a.com', payLoad, null, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(typeof data, 'object')
    assert.strictEqual(data['Success'], 'User deleted successfully.')

    done()
  })
}


// cart.js
// GET
api["GET /api/cart should return an array of items in user's cart"] = done => {
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
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('g@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  helpers.makeRequest('GET', '/api/cart', payLoad, token.id, (statusCode, data) => {
    assert.strictEqual(statusCode, 200)
    assert.strictEqual(Array.isArray(data), true)

    // Delete token
    io.delete(dir.tokens)(token.id)

    // Delete user
    io.delete(dir.users)('g@a.com')

    done()
  })
}

// PUT
api["PUT /api/cart should update and return user's cart"] = done => {
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
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('h@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({
    "item": "barbeque"
  })

  helpers.makeRequest('PUT', '/api/cart', payLoad, token.id, (statusCode, data) => {
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
api["DELETE /api/cart should delete item and return user's cart"] = done => {
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
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('i@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({})

  helpers.makeRequest('DELETE', '/api/cart?item=barbeque', payLoad, token.id, (statusCode, data) => {
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


// order.js
// POST
api['POST /api/order should order items in cart and return an array of orders'] = done => {
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
api['GET /api/order should return order object'] = done => {
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


// checkout.js
// POST
api['POST /api/checkout should send email, payment and return success message'] = done => {
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
  const callBack = () => console.log('hello')
  const token = crypto.createToken(callBack)('l@a.com')(crypto.createRandomString(20))

  const payLoad = JSON.stringify({
    'stripeToken': 'tok_visa',
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


// Export the tests to the runner
module.exports = api