/* Cart handler */

// Dependencies
const utils = require('../../utils')
const helpers = require('./helpers')


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

        utils.get(utils.userDir)(token.email)
          .then(user => {
              const cart = helpers.getOrCreateCart(
                utils.parseJsonToObject(user))
              callBack(200, cart)
            }
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

        // Check whether menu item is on menu
        utils.readDir(utils.menuItemDir())
          .then(xs => {
            const menu = utils.map(utils.slice(0)(-5))(xs)
            if (!menu.includes(item)) {
              // Requested item is not on menu
              callBack(400, {
                'Error': 'Item requested is not on menu.'
              })
              return
            }

            // Get user
            utils.get(utils.userDir)(token.email)
              .then(u => {
                const user = utils.parseJsonToObject(u)

                // Get menu item
                utils.get(utils.menuItemDir)(item)
                  .then(m => {
                    const menuItem = utils.parseJsonToObject(m)

                    // Get cart
                    const cart = helpers.getOrCreateCart(user)

                    // Remove menu item ID and
                    // update cart with menu item
                    delete menuItem.id
                    user.cart = user.cart.concat([menuItem])

                    // Write user and return cart
                    helpers.writeUser(user)
                    callBack(200, user.cart)
                  })
              })
          })
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