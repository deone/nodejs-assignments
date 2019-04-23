/* Order handler */

// Dependencies
const helpers = require('../helpers')

const orderHandler = {}

orderHandler.order = (data, callBack) => {
  const acceptableMethods = ['post', 'get']
  return helpers.requestDispatcher(
    data, callBack, acceptableMethods, orderHandler._order)
}

orderHandler._order = {}

// Order - post
// Required data: token ID
// Optional data: none
orderHandler._order.post = (data, callBack) => {
  // Get tokenId from header
  const [tokenId] = helpers.validate([data.headers.token])

  if (!helpers.isTokenProvided(
    tokenId, callBack)) {
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is expired
      if (!helpers.isTokenExpired(
        tokenObject.expires, callBack)) {
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
                      'Error': 'User has no shopping cart.'
                    })
                    return
                  }

                  const cart = userObject.cart
                  if (!cart.length) {
                    callBack(400, {
                      'Error': "User's shopping cart is empty."
                    })
                    return
                  }

                  // Place order
                  // - Set ID to random string
                  const id = helpers.createRandomString(20)

                  // - Set paid and mailSent properties
                  // on order object to false
                  const paid = false
                  const mailSent = false

                  // - Get price for each item in
                  // cart and create order item objects
                  const items = userObject.cart

                  // - Set items property on order
                  // object to list of order item objects
                  const totalPrice = items.reduce(
                    (a, b) => a + b.price, 0
                  )

                  // - Set totalPrice property on
                  // order object to total price of items
                  // - Create order object
                  const order = {
                    id, email, paid, mailSent, totalPrice, items
                  }

                  // - Write order object to file with
                  // file name as order ID
                  helpers.openFile(
                    helpers.orderDir(id), 'wx'
                  )
                    .then(fileDescriptor => {
                      helpers.writeFile(
                        fileDescriptor, JSON.stringify(order)
                      )
                        .catch(err => callBack(500, {
                          'Error': err.toString()
                        }))
                    })
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

                  const userOrder = {'id': id, 'value': totalPrice}
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
orderHandler._order.get = (data, callBack) => {
  const [tokenId, orderId] = helpers.validate([
    data.headers.token,
    data.queryStringObject.id
  ])

  if (!helpers.isTokenProvided(
    tokenId, callBack)) {
    return
  }

  if (!helpers.isRequiredFieldProvided(
    orderId, callBack)) {
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is expired
      if (!helpers.isTokenExpired(
        tokenObject.expires, callBack)) {
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