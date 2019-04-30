/* Order handler */

// Dependencies
const utils = require('../../utils')
const helpers = require('./helpers')


const orderHandler = {}

orderHandler.order = callBack =>
  data => {
    const dispatch =
      utils.request.dispatch(callBack)(orderHandler._order)
    dispatch(['post', 'get'])(data)
  }

orderHandler._order = {}

// Order - post
// Required data: token ID
// Optional data: none
orderHandler._order.post = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = utils.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    utils.io.get(utils.dir.tokens)(tokenId)
      .then(t => {
        const token = utils.json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.io.get(utils.dir.users)(token.email)
          .then(u => {
            const user = utils.json.toObject(u)
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
            utils.io.writeFile(utils.dir.orders(order.id),
              JSON.stringify(order))
              .catch(err =>
                callBack(500, {'Error': err.toString()}))

            // Update user
            const o = {
              orderId: order.id,
              totalPrice: order.totalPrice
            }

            const updatedUser = helpers.updateUser(user)(o)
            utils.io.writeUser(updatedUser)
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
    const [tokenId, orderId] = utils.validate([
      data.headers.token,
      data.queryStringObject.id
    ])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!orderId) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Get token
    utils.io.get(utils.dir.tokens)(tokenId)
      .then(x => {
        const token = utils.json.toObject(x)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.io.get(utils.dir.users)(token.email)
          .then(user => {
            !utils.json.toObject(user).orders
              ? callBack(404, {'Error': 'User has no orders.'})
              // Get order
              : utils.io.get(utils.dir.orders)(orderId)
                  .then(o => {
                    const order = utils.json.toObject(o)
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