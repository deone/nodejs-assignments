/* Cart handler */

// Dependencies
const helpers = require('../helpers')

const cartHandler = {}

cartHandler.cart = (data, callBack) => {
  const acceptableMethods = ['get', 'put', 'delete']
  return helpers.requestDispatcher(
    data, callBack, acceptableMethods, cartHandler._cart)
}

cartHandler._cart = {}

// Cart - get
// Required data - tokenID
// Optional data - none
cartHandler._cart.get = (data, callBack) => {
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
                          userObject.cart = []
                          // Store updates
                          helpers.writeUser(email, userObject, 'w', 'cart', callBack)
                        } else {
                          callBack(200, userObject.cart) 
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

// Cart - put
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.put = (data, callBack) => {
  // Get tokenID from header  
  const tokenId = helpers.validate(data.headers.token)
  const item = helpers.validate(data.payload.item)

  if (tokenId && item) {
    // Get token
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        // Check whether token is valid
        if (tokenObject.expires > Date.now()) {
          // Token is valid
          // Get menu item and validate

          if (item) {
            // Check whether menu item is on menu
            helpers.readDir(helpers.filePath(helpers.baseDir, 'menuitems'))
              .then(fileNames => {
                const menu = fileNames.map(fileName => fileName.slice(0, -5))
                if (!menu.includes(item)) {
                  callBack(400, {'Error': 'Item provided is not on menu.'})
                } else {
                  helpers.readDir(helpers.filePath(helpers.baseDir, 'menuitems'))
                    .then(fileNames => {
                      fileNames.forEach(fileName => {
                        if (item === fileName.slice(0, -5)) {
                          helpers.readFile(helpers.filePath(helpers.baseDir, 'menuitems', item), 'utf8')
                            .then(menuItem => {
                              const menuItemObject = helpers.parseJsonToObject(menuItem)
                              // Get cart
                              helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
                                .then(fileNames => {
                                  if (!fileNames.length) {
                                    // No file in users directory
                                    callBack(400, {'Error': 'User not found.'})
                                  } else {
                                    fileNames.forEach(fileName => {
                                      const email = fileName.slice(0, -5)
                                      if (email === tokenObject.email) {
                                        // Update cart
                                        helpers.getUser(email)
                                          .then(user => {
                                            const userObject = helpers.parseJsonToObject(user)
                                            if (!userObject.hasOwnProperty('cart')) {
                                              userObject.cart = []
                                            }
                                            delete menuItemObject.id
                                            userObject.cart.push(menuItemObject)
                                            // Store updates
                                            helpers.writeUser(email, userObject, 'w', 'cart', callBack)
                                          })
                                          .catch(err => {
                                            console.log(err)
                                            callBack(500, {'Error': 'Unable to get cart.'})
                                          })
                                      }
                                    })
                                  }
                                })
                                .catch(err => {
                                  console.log(err)
                                  callBack(500, {'Error': 'Unable to read user directory.'})
                                })
                            })
                            .catch(err => {
                              console.log(err)
                              callBack(500, {'Error': 'Unable to read menu entry.'})
                            })
                        }
                      })
                    })
                    .catch(err => {
                      console.log(err)
                      callBack(500, {'Error': 'Unable to read menu directory.'})
                    })
                }
              })
              .catch(err => {
                console.log(err)
                callBack(500, {'Error': 'Unable to fetch menu.'})
              })

            // Get user object
            // Read users directory
            
          }
        } else {
          callBack(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => {
        console.log(err)
        callBack(500, {'Error': 'Unable to get token.'})
      })
  } else {
    callBack(401, {'Error': 'Authentication token not provided. Missing required field.'})
  }
}

// Cart - delete
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.delete = (data, callBack) => {
  // Get tokenID from header  
  const tokenId = helpers.validate(data.headers.token)
  const menuItem = helpers.validate(data.payload.item)

  if (tokenId && menuItem) {
    // Get token
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        // Check whether token is valid
        if (tokenObject.expires > Date.now()) {
          // Token is valid
          // Get menu item and validate

          // Get user object
          // Read users directory
          helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
            .then(fileNames => {
              if (!fileNames.length) {
                // No file in users directory
                callBack(400, {'Error': 'User not found'})
              } else {
                fileNames.forEach(fileName => {
                  const email = fileName.slice(0, -5)
                  if (email === tokenObject.email) {
                    // Update cart
                    helpers.getUser(email)
                      .then(user => {
                        const userObject = helpers.parseJsonToObject(user)
                        if (!userObject.hasOwnProperty('cart')) {
                          callBack(400, {'Error': 'User has no shopping cart.'})
                        } else {
                          const cart = userObject.cart
                          if (!cart.length) {
                            callBack(400, {'Error': 'Shopping cart is empty.'})
                          } else {
                            userObject.cart = cart.filter(item => item.name !== menuItem)
                            // Store updates
                            helpers.writeUser(email, userObject, 'w', 'cart', callBack)
                          }
                        }
                      })
                      .catch(err => {
                        console.log(err)
                        callBack(500, {'Error': 'Unable to get cart.'})
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
        callBack(500, {'Error': 'Unable to get token.'})
      })
  } else {
    callBack(400, {'Error': 'Authentication token not provided. Missing required fields.'})
  }  
}


module.exports = cartHandler