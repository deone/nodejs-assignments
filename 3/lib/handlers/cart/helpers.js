/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.getCart = callBack =>
  x => {
    const user = utils.parseJsonToObject(x)
    if (!user.hasOwnProperty('cart')) {
      user.cart = []
      // Store updates
      utils.writeUser(
        user.email, user, 'w', callBack, 'cart'
      )
    } else {
      callBack(200, user.cart)
    }
  }

helpers.getUserCart = callBack =>
  token =>
    x => {
      const email = x.slice(0, -5)
      // This is same as
      // if (email === token.email) {...}
      email === token.email &&
        // Get cart
        utils.get(utils.userDir)(email)
          .then(u => helpers.getCart(callBack)(u))
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
    }


module.exports = helpers