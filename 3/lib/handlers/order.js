/* Order handler */

// Dependencies
const helpers = require('../helpers')

const updateUser = user =>
  order => {
    // - First time user is placing an order
    if (!user.hasOwnProperty('orders')) {
      // Set property to empty list
      user.orders = []
    }

    // Empty cart on user object
    user.cart = []

    // Update orders
    user.orders = user.orders.concat([order])

    return user
  }

const placeOrder = items => {
  // Set ID to random string
  const id = helpers.createRandomString(20)

  // Set paid and mailSent properties
  // on order object
  const paid = false
  const mailSent = false

  // compute total price
  const reduce = f => xs => xs.reduce(f, 0)
  const addPrices = (a, b) => (a + b.price)
  const totalPrice = reduce(addPrices)(items)

  // return order object
  return {
    id, paid, mailSent, totalPrice, items
  }
}

const orderHandler = {}

orderHandler.order = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(orderHandler._order)
    dispatch(['post', 'get'])(data)
  }

orderHandler._order = {}

// Order - post
// Required data: token ID
// Optional data: none
orderHandler._order.post = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = helpers.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    helpers.get(helpers.tokenDir)(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)

        // Check whether token is expired
        if (Date.now() > tokenObject.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get user object
        // Read users directory
        helpers.readDir(helpers.userDir())
          .then(xs => {
            xs.forEach(x => {
              const email = x.slice(0, -5)
              email === tokenObject.email &&
                // Get cart
                helpers.get(helpers.userDir)(email)
                  .then(u => {
                    const user = helpers.parseJsonToObject(u)

                    if (!user.hasOwnProperty('cart')) {
                      callBack(400, {
                        'Error': 'You have no shopping cart.'
                      })
                      return
                    }

                    const cart = user.cart
                    if (!cart.length) {
                      callBack(400, {
                        'Error': "Your shopping cart is empty."
                      })
                      return
                    }

                    // Place order
                    const order = Object.assign(
                      placeOrder(cart), { email })

                    // Write order object to file
                    const write = helpers.fileWriter(order)
                    helpers.openFile(
                      helpers.orderDir(order.id), 'wx'
                    )
                      .then(write)
                      .catch(err => callBack(500, {
                        'Error': err.toString()
                      }))

                    // Update user
                    const o = {
                      orderId: order.id,
                      totalPrice: order.totalPrice
                    }
                    const updatedUser = updateUser(user)(o)

                    // Write updated user to file
                    helpers.writeUser(
                      email, updatedUser, 'w', callBack, 'order')
                  })
                  .catch(err => callBack(500, {
                    'Error': err.toString()
                  }))
            })
          })
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
      })
      .catch(err => callBack(500, {
        'Error': err.toString()
      }))
  }

// Order - get
// Required data: token ID, order ID in querystring
// Optional data: none
orderHandler._order.get = callBack =>
  data => {
    const [tokenId, orderId] = helpers.validate([
      data.headers.token,
      data.queryStringObject.id
    ])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!orderId) {
      callBack(400, {'Error': helpers.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    helpers.get(helpers.tokenDir)(tokenId)
      .then(x => {
        const token = helpers.parseJsonToObject(x)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get user object
        // Read users directory
        helpers.readDir(helpers.userDir())
          .then(ys => {
            ys.forEach(y => {
              const email = y.slice(0, -5)
              email === token.email &&
                // Get order
                helpers.readDir(helpers.orderDir())
                  .then(zs => {
                    if (!zs.length) {
                      // No file in orders directory
                      callBack(400, {'Error': 'Order not found.'})
                      return
                    }

                    zs.forEach(z => {
                      orderId === z.slice(0, -5) &&
                        helpers.readFile(
                          helpers.orderDir(orderId),
                          'utf8'
                        )
                          .then(o => {
                            const order =
                              helpers.parseJsonToObject(o)
                            callBack(200, order)
                          })
                          .catch(err => callBack(500, {
                            'Error': err.toString()
                          }))
                    })
                  })
                  .catch(err => callBack(500, {
                    'Error': err.toString()
                  }))
            })
          })
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
      })
      .catch(err => callBack(500, {
        'Error': err.toString()
      }))
  }


module.exports = orderHandler