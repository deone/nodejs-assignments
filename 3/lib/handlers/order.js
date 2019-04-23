/* Order handler */

// Dependencies
const helpers = require('../helpers')

const orderHandler = {}

orderHandler.order = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(orderHandler._order)
    dispatch(['post', 'get'])(data)
  }

orderHandler._order = {}

const placeOrder = items => {
  // - Set ID to random string
  const id = helpers.createRandomString(20)

  // - Set paid and mailSent properties
  // on order object to false
  const paid = false
  const mailSent = false

  // - Get price for each item in
  // cart and create order item objects

  // - Set items property on order
  // object to list of order item objects
  const totalPrice = items.reduce(
    (a, b) => a + b.price, 0
  )

  // - Set totalPrice property on
  // order object to total price of items
  // - Create order object
  return {
    id, paid, mailSent, totalPrice, items
  }
}

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
    helpers.getToken(tokenId)
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
          .then(fileNames => {
            fileNames.forEach(fileName => {
              const email = fileName.slice(0, -5)
              email === tokenObject.email &&
                // Get cart
                helpers.getUser(email)
                  .then(user => {
                    const userObject = helpers.parseJsonToObject(user)

                    if (!userObject.hasOwnProperty('cart')) {
                      callBack(400, {
                        'Error': 'You have no shopping cart.'
                      })
                      return
                    }

                    const cart = userObject.cart
                    if (!cart.length) {
                      callBack(400, {
                        'Error': "Your shopping cart is empty."
                      })
                      return
                    }

                    // Place order
                    const order = Object.assign(placeOrder(cart), { email })

                    // - Write order object to file with
                    // file name as order ID
                    const write = helpers.fileWriter(order)
                    helpers.openFile(
                      helpers.orderDir(order.id), 'wx'
                    )
                      .then(write)
                      .catch(err => callBack(500, {
                        'Error': err.toString()
                      }))

                    // - Empty cart on user object
                    userObject.cart = []

                    // - Set orders property on
                    // user object to list of order IDs

                    // - First time user is placing an order
                    if (!userObject.hasOwnProperty('orders')) {
                      // Set property to empty list
                      userObject.orders = []
                    }

                    const userOrder = {'id': order.id, 'value': order.totalPrice}
                    userObject.orders.push(userOrder)

                    // - Update user object on file
                    helpers.writeUser(
                      email, userObject, 'w', callBack, 'order'
                    )
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
    helpers.getToken(tokenId)
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
          .then(fileNames => {
            fileNames.forEach(fileName => {
              const email = fileName.slice(0, -5)
              email === tokenObject.email &&
                // Get order
                helpers.readDir(helpers.orderDir())
                  .then(orderFileNames => {
                    if (!orderFileNames.length) {
                      // No file in orders directory
                      callBack(400, {'Error': 'Order not found.'})
                      return
                    }

                    orderFileNames.forEach(orderFileName => {
                      orderId === orderFileName.slice(0, -5) &&
                        helpers.readFile(
                          helpers.orderDir(orderId),
                          'utf8'
                        )
                          .then(order => {
                            const orderObject = helpers.parseJsonToObject(order)
                            callBack(200, orderObject)
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