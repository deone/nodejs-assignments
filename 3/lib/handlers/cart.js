/* Cart handler */

// Dependencies
const helpers = require('../helpers')

const cartHandler = {}

cartHandler.cart = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(cartHandler._cart)
    dispatch(['get', 'put', 'delete'])(data)
  }

cartHandler._cart = {}

// Cart - get
// Required data - tokenID
// Optional data - none
cartHandler._cart.get = callBack =>
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
cartHandler._cart.put = callBack =>
  data => {
    // Get tokenID from header
    const [tokenId, item] = helpers.validate([
      data.headers.token,
      data.payload.item
    ])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!helpers.isRequiredFieldProvided(
      item, callBack)) {
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
        // Get menu item and validate
        // Check whether menu item is on menu
        helpers.readDir(helpers.menuItemDir())
          .then(fileNames => {
            const menu = fileNames.map(fileName =>
              fileName.slice(0, -5)
            )

            if (!menu.includes(item)) {
              // Item is not on menu
              callBack(400, {
                'Error': 'Item requested is not on menu.'
              })
              return
            }

            // Item is on menu, get item
            helpers.readDir(helpers.menuItemDir())
              .then(fileNames => {
                fileNames.forEach(fileName => {

                  // This is same as
                  // if (item === fileName.slice(0, -5)) {...}
                  item === fileName.slice(0, -5) &&
                    helpers.readFile(
                      helpers.menuItemDir(item), 'utf8'
                    )
                      .then(menuItem => {
                        const menuItemObject = helpers.parseJsonToObject(
                          menuItem
                        )

                        // Get cart, so we can
                        // update it with menu item
                        helpers.readDir(
                          helpers.userDir()
                        )
                          .then(fileNames => {
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
cartHandler._cart.delete = callBack =>
  data => {
    // Get tokenID from header  
    const [tokenId, menuItem] = helpers.validate([
      data.headers.token,
      data.queryStringObject.item
    ])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!helpers.isRequiredFieldProvided(
      menuItem, callBack)) {
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
        // Get menu item and validate

        // Get user object
        // Read users directory
        helpers.readDir(helpers.userDir())
          .then(fileNames => {
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