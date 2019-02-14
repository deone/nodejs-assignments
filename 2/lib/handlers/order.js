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
                            // - Create order object
                            // - Set ID to random string
                            // - Set user property to email
                            // - Set paid and mailSent properties on order object to false
        
                            // - Get price for each item in cart and create order item objects
                            // - Set items property on order object to list of order item objects
                            // - Set totalPrice property on order object to total price of items
                            // - Empty cart on user object
                            // - Write order object to file with file name as order ID

                            // - Set orders property on user object to list of order IDs
                            // - Update user object on file
                          }
                        }
                      })
                      .catch(err => {
                        console.log(err)
                        callBack(500, {'Error': 'Unable to get cart'})
                      })
                  }
                })
              }
            })
            .catch(err => {
              console.log(err)
              callBack(500, {'Error': 'Unable to get user.'})
            })
        } else {
          callBack(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => {
        console.log(err)
        callBack(500, {'Error': 'Unable to get token'})
      })
  } else {
    callBack(401, {'Error': 'Authentication token not provided'})
  }
}

// Order - get
// Required data: token ID
// Optional data: none
orderHandler._order.get = (data, callBack) => {
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
                    // Get order
                  }
                })
              }
            })
            .catch(err => {
              console.log(err)
              callBack(500, {'Error': 'Unable to get user.'})
            })
        } else {
          callBack(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => {
        console.log(err)
        callBack(500, {'Error': 'Unable to get token'})
      })
  } else {
    callBack(401, {'Error': 'Authentication token not provided'})
  }  
}


module.exports = orderHandler