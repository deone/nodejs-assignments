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
  
    if (!helpers.isTokenProvided(
      tokenId, callBack)) {
      return
    }
  
    if (!(orderId && stripeToken)) {
      callBack(400, {'Error': 'Required fields missing.'})
      return
    }
  
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
  
        // Check whether token is expired
        if (!helpers.isTokenExpired(
          tokenObject.expires, callBack)) {
          return
        }
  
        // Get user email
        helpers.readDir(helpers.userDir())
          .then(fileNames => {
            fileNames.forEach(fileName => {
              const email = fileName.slice(0, -5)
              // This is same as
              // if (email === tokenObject.email) {...}
              email === tokenObject.email &&
                // Get order
                helpers.readFile(
                  helpers.orderDir(orderId),
                  'utf8'
                )
                  .then(order => {
                    const orderObject = helpers.parseJsonToObject(order)
  
                    // Make payment
                    const stripePayload = queryString.stringify({
                      amount: Math.round(orderObject.totalPrice * 100),
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
  
                        orderObject.paid = true
                        // Send mail
                        const mailgunPayload = queryString.stringify({
                          'from': `Dayo Osikoya<info@${config.mailgunDomain}>`,
                          'to': 'alwaysdeone@gmail.com',
                          'subject': `Order No. ${orderObject.id}`,
                          'text': `Dear ${email}, an order with a total amount of ${orderObject.totalPrice} was made by you.`
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
                            orderObject.mailSent = true
                            // Update order
                            helpers.openFile(helpers.orderDir(orderId), 'w')
                              .then(fileDescriptor => {
                                helpers.writeFile(
                                  fileDescriptor,
                                  JSON.stringify(orderObject)
                                )
                                  .catch(err => callBack(500, {
                                    'Error': err.toString()
                                  }))
                                callBack(200, {
                                  'Success': 'Payment processed and user notified successfully.'
                                })
                              })
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