/* Cart handler */

// Dependencies
const utils = require('../../helpers')

const path = require('path')
const helpers = require(path.resolve(__dirname, "./helpers"))


const cartHandler = {}

cartHandler.cart = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(cartHandler._cart)
    dispatch(['get', 'put', 'delete'])(data)
  }

cartHandler._cart = {}

// Cart - get
// Required data - tokenID
// Optional data - none
cartHandler._cart.get = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = utils.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.readDir(utils.userDir())
          .then(
            utils.forEach(user =>
              helpers.getUserCart(callBack)(token)(user)
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
    const [tokenId, item] = utils.validate([
      data.headers.token,
      data.payload.item
    ])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!item) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get menu item and validate
        // Check whether menu item is on menu
        utils.readDir(utils.menuItemDir())
          .then(xs => {
            const menu = utils.map(x => x.slice(0, -5))(xs)

            if (!menu.includes(item)) {
              // Item is not on menu
              callBack(400, {
                'Error': 'Item requested is not on menu.'
              })
              return
            }

            // Item is on menu, get item
            utils.readDir(utils.menuItemDir())
              .then(ys => {
                ys.forEach(y => {
                  // This is same as
                  // if (item === fileName.slice(0, -5)) {...}
                  item === y.slice(0, -5) &&
                    utils.readFile(
                      utils.menuItemDir(item), 'utf8'
                    )
                      .then(m => {
                        const menuItem = utils.parseJsonToObject(m)

                        // Get cart, so we can
                        // update it with menu item
                        utils.readDir(
                          utils.userDir()
                        )
                          .then(zs => {
                            zs.forEach(z => {
                              const email = z.slice(0, -5)
                              // This is same as
                              // if (email === token.email) {...}
                              email === token.email &&
                                // Update cart
                                utils.get(utils.userDir)(email)
                                  .then(u => {
                                    const user =
                                      utils.parseJsonToObject(u)

                                    if (!user.hasOwnProperty('cart')) {
                                      user.cart = []
                                    }
                                    delete menuItem.id
                                    user.cart.push(menuItem)

                                    // Store updates
                                    utils.writeUser(
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
    const [tokenId, menuItem] = utils.validate([
      data.headers.token,
      data.queryStringObject.item
    ])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!menuItem) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Get menu item and validate

        // Get user object
        // Read users directory
        utils.readDir(utils.userDir())
          .then(xs => {
            xs.forEach(x => {
              const email = x.slice(0, -5)
              email === token.email &&
                // Update cart
                utils.get(utils.userDir)(email)
                  .then(u => {
                    const user = utils.parseJsonToObject(u)

                    if (!user.cart.length ||
                      !user.hasOwnProperty('cart')) {
                      callBack(400, {
                        'Error': 'Shopping cart is empty.'
                      })
                      return
                    }

                    const isNeeded = item => item.name !== menuItem
                    user.cart = utils.filter(isNeeded)(user.cart)

                    // Store updates
                    utils.writeUser(
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