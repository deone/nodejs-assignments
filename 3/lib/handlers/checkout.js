/* Checkout handler */

// Dependencies
const {
  request,
  validate,
  errors,
  io,
  dir,
  json
} = require('../utils')

const checkoutHandler = {}

checkoutHandler.checkout = callback =>
  data => {
    const dispatch =
      request.dispatch(callback)(checkoutHandler._checkout)
    dispatch(['post'])(data)
  }

checkoutHandler._checkout = {}

// Checkout - post
// Required data - token ID in header. order ID in payload
checkoutHandler._checkout.post = callback =>
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
            const payload = request.createPayload(token)(order)

            const stripePayload = payload('stripe')
            const stripeOptions = request.setOptions(stripePayload)

            // Make payment
            request.send(stripePayload)(stripeOptions)
              ((err, data) => {
                if (err) {
                  callback(500, {'Error': 'Unable to process payment.'})
                  return
                }
              })

            order.paymentStatus = 'paid'

            const mailgunPayload = payload('mailgun')
            const mailgunOptions = request.setOptions(mailgunPayload)

            // Send email
            request.send(mailgunPayload)(mailgunOptions)
              ((err, data) => {
                if (err) {
                  callback(500, {'Error': 'Payment successful, but unable to notify user.'})
                  return
                }
              })

            order.mailSent = true

            // Update order
            io.writeFile(dir.orders(order.id),
              JSON.stringify(order))
              .then(
                callback(200, {
                  'Success': 'Payment processed and user notified successfully.'
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


module.exports = checkoutHandler 