/* Cart handler */

// Dependencies
const helpers = require('./helpers')
const {
  request,
  validate,
  errors,
  io,
  dir,
  json,
  fp
} = require('../../utils')


const cartHandler = {}

cartHandler.cart = callback =>
  data => {
    const dispatch =
      request.dispatch(callback)(cartHandler._cart)
    dispatch(['get', 'put', 'delete'])(data)
  }

cartHandler._cart = {}

// Cart - get
// Required data - tokenID
// Optional data - none
cartHandler._cart.get = callback =>
  data => {
    // Get tokenId from header
    const [tokenId] = validate([data.headers.token])

    if (!tokenId) {
      callback(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callback(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        io.get(dir.users)(token.email)
          .then(user => {
              const cart = helpers.getOrCreateCart(callback)(
                json.toObject(user))
              callback(200, cart)
            }
          )
          .catch(err =>
            callback(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callback(500, {'Error': err.toString()}))
  }

// Cart - put
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.put = callback =>
  data => {
    // Get tokenID from header
    const [tokenId, item] = validate([
      data.headers.token,
      data.payload.item
    ])

    if (!tokenId) {
      callback(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!item) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callback(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        // Check whether menu item is on menu
        io.readDir(dir.menuItems())
          .then(xs => {
            const menu = fp.map(fp.slice(0)(-5))(xs)
            if (!menu.includes(item)) {
              // Requested item is not on menu
              callback(400, {'Error': 'Item requested is not on menu.'})
              return
            }

            // Get user
            io.get(dir.users)(token.email)
              .then(u => {
                const user = json.toObject(u)
                // Get menu item
                io.get(dir.menuItems)(item)
                  .then(m => {
                    const menuItem = json.toObject(m)
                    // Get cart
                    const cart = helpers.getOrCreateCart(callback)(user)
                    // Remove menu item ID and
                    // update cart with menu item
                    delete menuItem.id
                    user.cart = user.cart.concat([menuItem])

                    // Write user and return cart
                    io.writeUser(user)
                      .then(callback(200, user.cart))
                      .catch(err => callback(500, {'Error': err.toString()}))
                  })
                  .catch(err =>
                    callback(500, {'Error': err.toString()}))
              })
              .catch(err =>
                callback(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callback(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callback(500, {'Error': err.toString()}))
  }

// Cart - delete
// Required data - token ID, menu item
// Optional data - none
cartHandler._cart.delete = callback =>
  data => {
    // Get tokenID from header  
    const [tokenId, item] = validate([
      data.headers.token,
      data.queryStringObject.item
    ])

    if (!tokenId) {
      callback(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!item) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callback(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        // Get user
        io.get(dir.users)(token.email)
          .then(u => {
            const user = json.toObject(u)

            const isNeeded = x => x.name !== item
            user.cart = fp.filter(isNeeded)(user.cart)

            // Write user and return cart
            io.writeUser(user)
              .then(callback(200, user.cart))
              .catch(err =>
                callback(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callback(500, {'Error': err.toString()})
          )
      })
      .catch(err =>
        callback(500, {'Error': err.toString()}))
  }


module.exports = cartHandler