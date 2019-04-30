/* Order handler */

// Dependencies
const helpers = require('./helpers')
const {
  request,
  validate,
  errors,
  io,
  dir,
  json
} = require('../../utils')


const orderHandler = {}

orderHandler.order = callBack =>
  data => {
    const dispatch =
      request.dispatch(callBack)(orderHandler._order)
    dispatch(['post', 'get'])(data)
  }

orderHandler._order = {}

// Order - post
// Required data: token ID
// Optional data: none
orderHandler._order.post = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        io.get(dir.users)(token.email)
          .then(u => {
            const user = json.toObject(u)
            if (!user.hasOwnProperty('cart')) {
              callBack(400, {'Error': 'You have no shopping cart.'})
              return
            }

            const cart = user.cart
            if (!cart.length) {
              callBack(400, {'Error': 'Your shopping cart is empty.'})
              return
            }

            // Place order
            const order = Object.assign(
              helpers.placeOrder(cart), { email: token.email })

            // Write order object to file
            io.writeFile(dir.orders(order.id),
              JSON.stringify(order))
              .catch(err =>
                callBack(500, {'Error': err.toString()}))

            // Update user
            const o = {
              orderId: order.id,
              totalPrice: order.totalPrice
            }

            const updatedUser = helpers.updateUser(user)(o)
            io.writeUser(updatedUser)
              .then(callBack(200, user.orders))
              .catch(err =>
                callBack(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }

// Order - get
// Required data: token ID, order ID in querystring
// Optional data: none
orderHandler._order.get = callBack =>
  data => {
    const [tokenId, orderId] = validate([
      data.headers.token,
      data.queryStringObject.id
    ])

    if (!tokenId) {
      callBack(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!orderId) {
      callBack(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(x => {
        const token = json.toObject(x)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        io.get(dir.users)(token.email)
          .then(user => {
            !json.toObject(user).orders
              ? callBack(404, {'Error': 'User has no orders.'})
              // Get order
              : io.get(dir.orders)(orderId)
                  .then(o => {
                    const order = json.toObject(o)
                    callBack(200, order)
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


module.exports = orderHandler