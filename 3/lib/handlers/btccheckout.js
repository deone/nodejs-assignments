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

BTCCheckoutHandler.charge = callback =>
  data => {
    const dispatch =
      request.dispatch(callback)(BTCCheckoutHandler._charge)
    dispatch(['post', 'get'])(data)
  }

BTCCheckoutHandler._charge = {}

// Checkout - post
// Required data - token, orderId
/* Optional data
  {
    "amount": 2
    "description": "Test charge",
    "currency": "USD",
    "order_id": "823320",
    "customer_name": "John Doe",
    "customer_email": "me@johndoe.com",
    "callback_url": "https://site.com/?handler=opennode",
    "success_url": "https://site.com/order/abc123"
  }
*/
BTCCheckoutHandler._charge.post = callback =>
  data => {
    const [tokenId, orderId] = validate([
      data.headers.token,
      data.payload.orderId
    ])

    if (!tokenId) {
      callback(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!orderId) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELDS})
      return
    }

    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callback(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        io.get(dir.orders)(orderId)
          .then(o => {
            const order = json.toObject(o)
            const payload = request.createPayload(token)(order)('opennode')

            const options = request.setOptions(payload)

            // Make payment
            request.send(payload)(options)
              ((err, data) => {
                if (err) {
                  callback(500, {'Error': 'Unable to create charge.'})
                  return
                }
              })

            order.paymentStatus = 'pending'

            // Update order
            io.writeFile(dir.orders(order.id),
              JSON.stringify(order))
              .then(
                callback(201, {
                  'Success': 'Charge created.'
                })
              )
              .catch(err =>
                callback(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callback(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callback(500, {'Error': err.toString()}))

  }

BTCCheckoutHandler._charge.get = callback =>
  data => {
    
  }


BTCCheckoutHandler.charges = callback =>
  data => {
    const dispatch =
      request.dispatch(callback)(BTCCheckoutHandler._charges)
    dispatch(['get'])(data)
  }

BTCCheckoutHandler._charges = {}


module.exports = BTCCheckoutHandler 