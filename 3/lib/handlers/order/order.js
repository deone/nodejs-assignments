/* Order handler */

// Dependencies
const utils = require('../../utils')
const helpers = require('./helpers')


const orderHandler = {}

orderHandler.order = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(orderHandler._order)
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
    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.get(utils.userDir)(token.email)
          .then(u => {
            const user = utils.parseJsonToObject(u)
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
            const write = utils.fileWriter(order)
            utils.openFile(
              utils.orderDir(order.id), 'wx'
            )
              .then(write)
              .catch(err =>
                callBack(500, {'Error': err.toString()}))

            // Update user
            const o = {
              orderId: order.id,
              totalPrice: order.totalPrice
            }
            const updatedUser = helpers.updateUser(user)(o)
            utils.writeUser(callBack)(user)
            callBack(200, updatedUser.orders)
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
    utils.get(utils.tokenDir)(tokenId)
      .then(x => {
        const token = utils.parseJsonToObject(x)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.get(utils.userDir)(token.email)
          .then(user => {
            !utils.parseJsonToObject(user).orders
              ? callBack(404, {'Error': 'User has no orders.'})
              // Get order
              : utils.get(utils.orderDir)(orderId)
                  .then(o => {
                    const order = utils.parseJsonToObject(o)
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