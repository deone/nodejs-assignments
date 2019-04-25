/* Cart helpers */
const h = require('../../helpers')

const helpers = {}

helpers.getCart = callBack =>
  x => {
    const user = h.parseJsonToObject(x)
    if (!user.hasOwnProperty('cart')) {
      user.cart = []
      // Store updates
      h.writeUser(
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
        h.get(h.userDir)(email)
          .then(u => helpers.getCart(callBack)(u))
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
    }


module.exports = helpers