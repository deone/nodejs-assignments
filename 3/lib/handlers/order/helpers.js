/* Order helpers */
const { crypto } = require('../../utils')

const helpers = {}

helpers.updateUser = user =>
  order => {
    // - First time user is placing an order
    if (!user.hasOwnProperty('orders')) {
      user.orders = []
    }

    // Empty cart on user object
    user.cart = []
    // Update orders list
    user.orders = user.orders.concat([order])

    return user
  }

helpers.placeOrder = items => {
  // Set ID to random string
  const id = crypto.createRandomString(20)

  // Set paid and mailSent properties
  // on order object
  const paid = false
  const mailSent = false

  // compute total price
  const reduce = f => xs => xs.reduce(f, 0)
  const addPrices = (a, b) => (a + b.price)
  const totalPrice = reduce(addPrices)(items)

  // return order object
  return {
    id, paid, mailSent, totalPrice, items
  }
}


module.exports = helpers