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

checkoutHandler.checkout = callBack =>
  data => {
    const dispatch =
      request.dispatch(callBack)(checkoutHandler._checkout)
    dispatch(['post'])(data)
  }

checkoutHandler._checkout = {}

// Checkout - post
// Required data - token ID in header. order ID in payload
checkoutHandler._checkout.post = callBack =>
  data => {
    const [tokenId, orderId] = validate([
      data.headers.token,
      data.payload.orderId
    ])

    if (!tokenId) {
      callBack(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!orderId) {
      callBack(400, {'Error': errors.MISSING_REQUIRED_FIELDS})
      return
    }

    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': errors.TOKEN_EXPIRED})
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
                  callBack(500, {'Error': 'Unable to process payment.'})
                  return
                }
              })

            order.paid = true

            const mailgunPayload = payload('mailgun')
            const mailgunOptions = request.setOptions(mailgunPayload)

            // Send email
            request.send(mailgunPayload)(mailgunOptions)
              ((err, data) => {
                if (err) {
                  callBack(500, {'Error': 'Payment successful, but unable to notify user.'})
                  return
                }
              })

            order.mailSent = true

            // Update order
            io.writeFile(dir.orders(order.id),
              JSON.stringify(order))
              .then(
                callBack(200, {
                  'Success': 'Payment processed and user notified successfully.'
                })
              )
              .catch(err =>
                callBack(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = checkoutHandler 