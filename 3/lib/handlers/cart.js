/* Cart handler */

// Dependencies
const helpers = require('../helpers')

const cartHandler = {}

cartHandler.cart = (data, callBack) =>
  helpers.requestDispatcher(
    data, callBack, ['get', 'put', 'delete'], cartHandler._cart
  )

cartHandler._cart = {}

// Cart - get
// Required data - tokenID
// Optional data - none
cartHandler._cart.get = (data, callBack) => {
  // Get tokenId from header
  const [tokenId] = helpers.validate(data.headers.token)

  if (!tokenId) {
    callBack(401, {
      'Error': 'Authentication token not provided'
    })
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is valid
      if (!tokenObject.expires > Date.now()) {
        callBack(401, {
          'Error': 'Invalid token. Please login again.'
        })
        return
      }

      // Token is valid
      // Get user object
      // Read users directory
      helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
        .then(fileNames => {
          if (!fileNames.length) {
            // No file in users directory
            callBack(400, {
                'Error': 'User not found.'
            })
            return
          }
            
          fileNames.forEach(fileName => {
            const email = fileName.slice(0, -5)

            // This is same as
            // if (email === tokenObject.email) {...}
            email === tokenObject.email &&
              // Get cart
              helpers.getUser(email)
                .then(user => {
                  const userObject = helpers.parseJsonToObject(user)
                  if (!userObject.hasOwnProperty('cart')) {
                    userObject.cart = []
                    // Store updates
                    helpers.writeUser(
                      email, userObject, 'w', callBack, 'cart'
                    )
                  } else {
                    callBack(200, userObject.cart)
                  }
                })
                .catch(err => callBack(500, {
                  'Error': err.toString()
                }))
          })
        })
        .catch(err =>
          callBack(500, {'Error': err.toString()})
        )
    })
    .catch(err =>
      callBack(500, {'Error': err.toString()})
    )
}

// Cart - put
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.put = (data, callBack) => {
  // Get tokenID from header  
  const [tokenId, item] = helpers.validate(
    data.headers.token,
    data.payload.item
  )

  if (!(tokenId && item)) {
    callBack(401, {
      'Error': 'Authentication token not provided. Missing required field.'
    })
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is valid
      if (Date.now() > tokenObject.expires) {
        callBack(401, {
          'Error': 'Invalid token. Please login again.'
        })
        return
      }

      // Token is valid
      // Get menu item and validate
      // Check whether menu item is on menu
      helpers.readDir(
        helpers.filePath(helpers.baseDir, 'menuitems')
      )
        .then(fileNames => {
          const menu = fileNames.map(fileName =>
            fileName.slice(0, -5)
          )

          if (!menu.includes(item)) {
            // Item is not on menu
            callBack(400, {
              'Error': 'Item provided is not on menu.'
            })
            return
          }

          // Item is on menu, get item
          helpers.readDir(helpers.filePath(
            helpers.baseDir, 'menuitems')
          )
            .then(fileNames => {
              fileNames.forEach(fileName => {

                // This is same as
                // if (item === fileName.slice(0, -5)) {...}
                item === fileName.slice(0, -5) &&
                  helpers.readFile(helpers.filePath(
                    helpers.baseDir, 'menuitems', item), 'utf8'
                  )
                    .then(menuItem => {
                      const menuItemObject = helpers.parseJsonToObject(
                        menuItem
                      )

                      // Get cart, so we can
                      // update it with menu item
                      helpers.readDir(
                        helpers.filePath(
                          helpers.baseDir, 'users'
                        )
                      )
                        .then(fileNames => {
                          if (!fileNames.length) {
                            // No file in users directory
                            callBack(400, {
                              'Error': 'User not found.'
                            })
                            return
                          }

                          fileNames.forEach(fileName => {
                            const email = fileName.slice(0, -5)
                            // This is same as
                            // if (email === tokenObject.email) {...}
                            email === tokenObject.email &&
                              // Update cart
                              helpers.getUser(email)
                                .then(user => {
                                  const userObject =
                                    helpers.parseJsonToObject(user)

                                  if (!userObject.hasOwnProperty('cart')) {
                                    userObject.cart = []
                                  }
                                  delete menuItemObject.id
                                  userObject.cart.push(menuItemObject)

                                  // Store updates
                                  helpers.writeUser(
                                    email, userObject, 'w', callBack, 'cart'
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
              })
            })
            .catch(err => callBack(500, {
              'Error': err.toString()
            }))
        })
        .catch(err => callBack(500, {
          'Error': err.toString()
        }))
    })
    .catch(err =>
      callBack(500, {
        'Error': err.toString()
      })
    )
}

// Cart - delete
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.delete = (data, callBack) => {
  // Get tokenID from header  
  const [tokenId, menuItem] = helpers.validate(
    data.headers.token,
    data.payload.item
  )

  if (!(tokenId && menuItem)) {
    callBack(400, {
      'Error': 'Authentication token not provided. Missing required fields.'
    })
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)
      // Check whether token is valid
      if (!tokenObject.expires > Date.now()) {
        callBack(401, {
          'Error': 'Invalid token. Please login again.'
        })
        return
      }

      // Token is valid
      // Get menu item and validate

      // Get user object
      // Read users directory
      helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
        .then(fileNames => {
          if (!fileNames.length) {
            // No file in users directory
            callBack(400, {'Error': 'User not found'})
            return
          }

          fileNames.forEach(fileName => {
            const email = fileName.slice(0, -5)
            email === tokenObject.email &&
              // Update cart
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
                      'Error': 'Shopping cart is empty.'
                    })
                    return
                  }

                  // Beware! Filter matches each item
                  // with condition and filters,
                  // Doesn't just delete the first
                  // item that matches.
                  userObject.cart = cart.filter(item =>
                    item.name !== menuItem
                  )

                  // Store updates
                  helpers.writeUser(
                    email, userObject, 'w', callBack, 'cart'
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


module.exports = cartHandler