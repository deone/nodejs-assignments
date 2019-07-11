/* BTCCheckout handler */

// Dependencies
const {
  request,
  validate,
  errors,
  io,
  dir,
  json
} = require('../utils')

const BTCCheckoutHandler = {}

BTCCheckoutHandler.charge = callBack =>
  data => {
    const dispatch =
      request.dispatch(callBack)(BTCCheckoutHandler._charge)
    dispatch(['post', 'get'])(data)
  }

BTCCheckoutHandler._charge = {}

BTCCheckoutHandler._charge.post = callBack =>
  data => {
    
  }

BTCCheckoutHandler._charge.get = callBack =>
  data => {
    
  }


BTCCheckoutHandler.charges = callBack =>
  data => {
    const dispatch =
      request.dispatch(callBack)(BTCCheckoutHandler._charges)
    dispatch(['get'])(data)
  }

BTCCheckoutHandler._charges = {}


module.exports = BTCCheckoutHandler 