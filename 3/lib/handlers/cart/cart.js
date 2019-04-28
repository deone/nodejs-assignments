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
              const cart = helpers.getOrCreateCart(callBack)(
                utils.parseJsonToObject(user))
              callBack(200, cart)
            }
          )
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
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
              callBack(400, {'Error': 'Item requested is not on menu.'})
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
                    const cart = helpers.getOrCreateCart(callBack)(user)
                    // Remove menu item ID and
                    // update cart with menu item
                    delete menuItem.id
                    user.cart = user.cart.concat([menuItem])

                    // Write user and return cart
                    utils.writeUser(user)
                      .then(callBack(200, user.cart))
                      .catch(err => callBack(500, {'Error': err.toString()}))
                  })
                  .catch(err =>
                    callBack(500, {'Error': err.toString()}))
              })
              .catch(err =>
                callBack(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }

// Cart - delete
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.delete = callBack =>
  data => {
    // Get tokenID from header  
    const [tokenId, item] = utils.validate([
      data.headers.token,
      data.queryStringObject.item
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

        // Get user
        utils.get(utils.userDir)(token.email)
          .then(u => {
            const user = utils.parseJsonToObject(u)

            const isNeeded = x => x.name !== item
            user.cart = utils.filter(isNeeded)(user.cart)

            // Write user and return cart
            utils.writeUser(user)
              .then(callBack(200, user.cart))
              .catch(err => callBack(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()})
          )
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = cartHandler