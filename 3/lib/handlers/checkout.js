/* Checkout handler */

// Dependencies
const queryString = require('querystring')

const helpers = require('../helpers')
const config = require('../config')

const checkoutHandler = {}

checkoutHandler.checkout = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(checkoutHandler._checkout)
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
    const [tokenId, orderId, stripeToken] = helpers.validate([
      data.headers.token,
      data.payload.orderId,
      data.payload.stripeToken
    ])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    if (!(orderId && stripeToken)) {
      callBack(400, {'Error': 'Required fields missing.'})
      return
    }

    helpers.get(helpers.tokenDir)(tokenId)
      .then(t => {
        const token = helpers.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Get user email
        helpers.readDir(helpers.userDir())
          .then(xs => {
            xs.forEach(x => {
              const email = x.slice(0, -5)
              // This is same as
              // if (email === token.email) {...}
              email === token.email &&
                // Get order
                helpers.readFile(
                  helpers.orderDir(orderId),
                  'utf8'
                )
                  .then(o => {
                    const order = helpers.parseJsonToObject(o)
  
                    // Make payment
                    const stripePayload = queryString.stringify({
                      amount: Math.round(order.totalPrice * 100),
                      currency: 'usd',
                      description: `${email}_${tokenId}_${Date.now()}`,
                      source: stripeToken
                    })

                    helpers.sendRequest(
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
                        helpers.sendRequest(
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
                            const write = helpers.fileWriter(order)
                            helpers.openFile(helpers.orderDir(orderId), 'w')
                              .then(write)
                              .then(
                                callBack(200, {
                                  'Success': 'Payment processed and user notified successfully.'
                                })
                              )
                              .catch(err => callBack(500, {
                                'Error': err.toString()
                              }))
                        })
                    })
                  })
                  .catch(err => callBack(500, {
                    'Error': err.toString()
                  }))
            })
          })
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
      })
      .catch(err => callBack(500, {
        'Error': err.toString()
      }))
  }


module.exports = checkoutHandler 