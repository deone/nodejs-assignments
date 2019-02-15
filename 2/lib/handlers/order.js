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
  const tokenId = helpers.validate(data.headers.token)
  if (tokenId) {
    // Get token
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        // Check whether token is valid
        if (tokenObject.expires > Date.now()) {
          // Token is valid
          // Get user object
          // Read users directory
          helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
            .then(fileNames => {
              if (!fileNames.length) {
                // No file in users directory
                callBack(400, {'Error': 'User not found.'})
              } else {
                fileNames.forEach(fileName => {
                  const email = fileName.slice(0, -5)
                  if (email === tokenObject.email) {
                    // Get cart
                    helpers.getUser(email)
                      .then(user => {
                        const userObject = helpers.parseJsonToObject(user)
                        if (!userObject.hasOwnProperty('cart')) {
                          callBack(400, {'Error': 'User has no shopping cart.'})
                        } else {
                          const cart = userObject.cart
                          if (!cart.length) {
                            callBack(400, {'Error': "User's shopping cart is empty."})
                          } else {
                            // Place order
                            // - Set ID to random string
                            const id = helpers.createRandomString(20)
                            // - Set user property to email
                            const user = email
                            // - Set paid and mailSent properties on order object to false
                            const paid = false
                            const mailSent = false
        
                            // - Get price for each item in cart and create order item objects
                            const items = userObject.cart
                            // - Set items property on order object to list of order item objects
                            const totalPrice = items.reduce((a, b) => a.price + b.price)
                            // - Set totalPrice property on order object to total price of items
                            // - Create order object
                            const order = {id, user, paid, mailSent, totalPrice, items}
                            // - Write order object to file with file name as order ID
                            helpers.openFile(helpers.filePath(helpers.baseDir, 'orders', id), 'wx')
                              .then(fileDescriptor => {
                                helpers.writeFile(fileDescriptor, JSON.stringify(order))
                                  .catch(err => callBack(500, {'Error': err.toString()}))
                              })
                              .catch(err => callBack(500, {'Error': err.toString()}))

                            // - Empty cart on user object
                            userObject.cart = []

                            // - Set orders property on user object to list of order IDs
                            // - First time user is placing an order
                            if (!userObject.hasOwnProperty('orders')) {
                              // Set property to empty list
                              userObject.orders = []
                            }
                            const userOrder = {'id': id, 'value': totalPrice}
                            userObject.orders.push(userOrder)

                            // - Update user object on file
                            helpers.writeUser(email, userObject, 'w', callBack, 'order')
                          }
                        }
                      })
                      .catch(err => callBack(500, {'Error': err.toString()}))
                  }
                })
              }
            })
            .catch(err => callBack(500, {'Error': err.toString()}))
        } else {
          callBack(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => callBack(500, {'Error': err.toString()}))
  } else {
    callBack(401, {'Error': 'Authentication token not provided.'})
  }
}

// Order - get
// Required data: token ID, order ID in querystring
// Optional data: none
orderHandler._order.get = (data, callBack) => {
  // Get tokenId from header
  const tokenId = helpers.validate(data.headers.token)
  const orderId = helpers.validate(data.queryStringObject.id)

  if (tokenId && orderId) {
    // Get token
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        // Check whether token is valid
        if (tokenObject.expires > Date.now()) {
          // Token is valid
          // Get user object
          // Read users directory
          helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
            .then(fileNames => {
              if (!fileNames.length) {
                // No file in users directory
                callBack(400, {'Error': 'User not found.'})
              } else {
                fileNames.forEach(fileName => {
                  const email = fileName.slice(0, -5)
                  if (email === tokenObject.email) {
                    // Get order
                    helpers.readDir(helpers.filePath(helpers.baseDir, 'orders'))
                      .then(orderFileNames => {
                        if (!orderFileNames.length) {
                          // No file in orders directory
                          callBack(400, {'Error': 'Order not found.'})
                        } else {
                          orderFileNames.forEach(orderFileName => {
                            if (orderId === orderFileName.slice(0, -5)) {
                              helpers.readFile(helpers.filePath(helpers.baseDir,
                                'orders', orderId), 'utf8')
                                .then(order => {
                                  const orderObject = helpers.parseJsonToObject(order)
                                  callBack(200, orderObject)
                                })
                                .catch(err => callBack(500, {'Error': err.toString()}))
                            }
                          })
                        }
                      })
                      .catch(err => callBack(500, {'Error': err.toString()}))
                  }
                })
              }
            })
            .catch(err => callBack(500, {'Error': err.toString()}))
        } else {
          callBack(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => callBack(500, {'Error': err.toString()}))
  } else {
    callBack(400, {'Error': 'Authentication token not provided. Missing required field.'})
  }  
}


module.exports = orderHandler