/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.getOrCreateCart = u =>
  callBack => {
    const user = utils.parseJsonToObject(u)
    if (!user.hasOwnProperty('cart')) {
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
    callBack(200, user.cart)
  }


module.exports = helpers