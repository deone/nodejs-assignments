/* Cart handler */

// Dependencies
const helpers = require('../helpers')

const getCart = callBack =>
  x => {
    const user = helpers.parseJsonToObject(x)
    if (!user.hasOwnProperty('cart')) {
      user.cart = []
      // Store updates
      helpers.writeUser(
        user.email, user, 'w', callBack, 'cart'
      )
    } else {
      callBack(200, user.cart)
    }
  }

const getUserCart = callBack =>
  token =>
    x => {
      const email = x.slice(0, -5)
      // This is same as
      // if (email === token.email) {...}
      email === token.email &&
        // Get cart
        helpers.get(helpers.userDir)(email)
          .then(u => getCart(callBack)(u))
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
    }

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
    helpers.get(helpers.tokenDir)(tokenId)
      .then(t => {
        const token = helpers.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        helpers.readDir(helpers.userDir())
          .then(
            helpers.forEach(user =>
              getUserCart(callBack)(token)(user)
            )
          )
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

    if (!item) {
      callBack(400, {'Error': helpers.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    helpers.get(helpers.tokenDir)(tokenId)
      .then(t => {
        const token = helpers.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get menu item and validate
        // Check whether menu item is on menu
        helpers.readDir(helpers.menuItemDir())
          .then(xs => {
            const menu = helpers.map(x => x.slice(0, -5))(xs)

            if (!menu.includes(item)) {
              // Item is not on menu
              callBack(400, {
                'Error': 'Item requested is not on menu.'
              })
              return
            }

            // Item is on menu, get item
            helpers.readDir(helpers.menuItemDir())
              .then(ys => {
                ys.forEach(y => {
                  // This is same as
                  // if (item === fileName.slice(0, -5)) {...}
                  item === y.slice(0, -5) &&
                    helpers.readFile(
                      helpers.menuItemDir(item), 'utf8'
                    )
                      .then(m => {
                        const menuItem = helpers.parseJsonToObject(m)

                        // Get cart, so we can
                        // update it with menu item
                        helpers.readDir(
                          helpers.userDir()
                        )
                          .then(zs => {
                            zs.forEach(z => {
                              const email = z.slice(0, -5)
                              // This is same as
                              // if (email === token.email) {...}
                              email === token.email &&
                                // Update cart
                                helpers.get(helpers.userDir)(email)
                                  .then(u => {
                                    const user =
                                      helpers.parseJsonToObject(u)

                                    if (!user.hasOwnProperty('cart')) {
                                      user.cart = []
                                    }
                                    delete menuItem.id
                                    user.cart.push(menuItem)

                                    // Store updates
                                    helpers.writeUser(
                                      email, user, 'w', callBack, 'cart'
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

    if (!menuItem) {
      callBack(400, {'Error': helpers.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    helpers.get(helpers.tokenDir)(tokenId)
      .then(t => {
        const token = helpers.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get menu item and validate

        // Get user object
        // Read users directory
        helpers.readDir(helpers.userDir())
          .then(xs => {
            xs.forEach(x => {
              const email = x.slice(0, -5)
              email === token.email &&
                // Update cart
                helpers.get(helpers.userDir)(email)
                  .then(u => {
                    const user = helpers.parseJsonToObject(u)

                    if (!user.cart.length ||
                      !user.hasOwnProperty('cart')) {
                      callBack(400, {
                        'Error': 'Shopping cart is empty.'
                      })
                      return
                    }

                    const isNeeded = item => item.name !== menuItem
                    user.cart = helpers.filter(isNeeded)(user.cart)

                    // Store updates
                    helpers.writeUser(
                      email, user, 'w', callBack, 'cart'
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