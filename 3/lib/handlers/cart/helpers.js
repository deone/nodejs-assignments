/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.getOrCreateCart = callBack =>
  user => {
    if (!user.hasOwnProperty('cart')) {
      user.cart = []
      utils.writeUser(user)
        .catch(err => callBack(500, {'Error': err.toString()}))
    }
    return user.cart
  }


module.exports = helpers