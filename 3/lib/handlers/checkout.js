/* Checkout handler */

// Dependencies
const queryString = require('querystring')

const utils = require('../utils')
const config = require('../config')

const checkoutHandler = {}

checkoutHandler.checkout = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(checkoutHandler._checkout)
    dispatch(['post'])(data)
  }

checkoutHandler._checkout = {}

// Checkout - post
// Required data - token ID. Stripe token and order ID in payload
/*
  Get required data
  Check that token is valid
  Get user email
  Get order
  Send payment request to stripe
  Send email to user
*/
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

    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        // Get user email
        utils.readDir(utils.userDir())
          .then(xs => {
            xs.forEach(x => {
              const email = x.slice(0, -5)
              // This is same as
              // if (email === token.email) {...}
              email === token.email &&
                // Get order
                utils.readFile(
                  utils.orderDir(orderId),
                  'utf8'
                )
                  .then(o => {
                    const order = utils.parseJsonToObject(o)

                    // Make payment
                    const stripePayload = queryString.stringify({
                      amount: Math.round(order.totalPrice * 100),
                      currency: 'usd',
                      description: `${email}_${tokenId}_${Date.now()}`,
                      source: stripeToken
                    })

                    utils.sendRequest(
                      stripePayload,
                      'api.stripe.com',
                      '/v1/charges',
                      `Bearer ${config.stripeKey}`,
                      (err, data) => {
                        if (err) {
                          callBack(500, {'Error': 'Unable to process payment.'})
                          return
                        }

                        order.paid = true
                        // Send mail
                        const mailgunPayload = queryString.stringify({
                          'from': `Dayo Osikoya<info@${config.mailgunDomain}>`,
                          'to': 'alwaysdeone@gmail.com',
                          'subject': `Order No. ${order.id}`,
                          'text': `Dear ${email}, an order with a total amount of ${order.totalPrice} was made by you.`
                        })

                        // Send email if payment is successful
                        utils.sendRequest(
                          mailgunPayload,
                          'api.mailgun.net',
                          `/v3/${config.mailgunDomain}/messages`,
                          ('Basic ' + Buffer.from(
                            (`api:${config.mailgunKey}`)
                            ).toString('base64')),
                          (err, data) => {
                            if (err) {
                              callBack(500, {
                                'Error': 'Payment successful, but unable to notify user.'
                              })
                              return
                            }
                            order.mailSent = true

                            // Update order
                            utils.writeFile(utils.orderDir(order.id),
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
                  })
                  .catch(err =>
                    callBack(500, {'Error': err.toString()}))
            })
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = checkoutHandler 