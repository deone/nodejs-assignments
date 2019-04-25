/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.createCart = user =>
  callBack => {
    user.cart = []
    // Write updated object
    const write = utils.fileWriter(user)
    utils.openFile(
      utils.userDir(user.email),
      'w'
    )
      .then(write)
      .catch(err =>
        callBack(500, {'Error': err.toString()})
      )
  }

helpers.getOrCreateCart = user =>
  callBack => {
    if (!user.hasOwnProperty('cart')) {
      helpers.createCart(user)(callBack)
    }
    callBack(200, user.cart)
  }


module.exports = helpers