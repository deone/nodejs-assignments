/* Checkout handler */

// Dependencies
const utils = require('../utils')

const checkoutHandler = {}

checkoutHandler.checkout = callBack =>
  data => {
    const dispatch =
      utils.request.dispatch(callBack)(checkoutHandler._checkout)
    dispatch(['post'])(data)
  }

checkoutHandler._checkout = {}

// Checkout - post
// Required data - token ID. Stripe token and order ID in payload
checkoutHandler._checkout.post = callBack =>
  data => {
    const [tokenId, orderId, stripeToken] = utils.validate([
      data.headers.token,
      data.payload.orderId,
      data.payload.stripeToken
    ])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!(orderId && stripeToken)) {
      callBack(400, {'Error': 'Required fields missing.'})
      return
    }

    utils.io.get(utils.dir.tokens)(tokenId)
      .then(t => {
        const token = utils.json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        utils.io.get(utils.dir.orders)(orderId)
          .then(o => {
            const order = utils.json.toObject(o)
            const payLoad = utils.request.createPayLoad(token)(order)

            const stripePayLoad = payLoad(stripeToken)
            const stripeOptions = utils.request.setOptions(stripePayLoad)

            // Make payment
            utils.request.send(stripePayLoad)(stripeOptions)
              ((err, data) => {
                if (err) {
                  callBack(500, {'Error': 'Unable to process payment.'})
                  return
                }
              })

            order.paid = true

            const mailgunPayLoad = payLoad()
            const mailgunOptions = utils.request.setOptions(mailgunPayLoad)

            // Send email
            utils.request.send(mailgunPayLoad)(mailgunOptions)
              ((err, data) => {
                if (err) {
                  callBack(500, {'Error': 'Payment successful, but unable to notify user.'})
                  return
                }
              })

            order.mailSent = true

            // Update order
            utils.io.writeFile(utils.dir.orders(order.id),
              JSON.stringify(order))
              .then(
                callBack(200, {
                  'Success': 'Payment processed and user notified successfully.'
                })
              )
              .catch(err =>
                callBack(500, {'Error': err.toString()}))
          })
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = checkoutHandler 