/* Cart helpers */
const utils = require('../../utils')

const helpers = {}

helpers.writeUser = user => {
  // Write updated object
  const write = utils.fileWriter(user)
  utils.openFile(
    utils.userDir(user.email),
    'w'
  ).then(write)
}

helpers.getOrCreateCart = user => {
  if (!user.hasOwnProperty('cart')) {
    user.cart = []
    helpers.writeUser(user)
  }
  return user.cart
}


module.exports = helpers