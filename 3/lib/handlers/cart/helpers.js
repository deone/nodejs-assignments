/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.getOrCreateCart = callBack =>
  user => {
    if (!user.hasOwnProperty('cart')) {
      user.cart = []
      utils.writeUser(callBack)(user)
    }
    return user.cart
  }


module.exports = helpers