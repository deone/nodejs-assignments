/* Checkout handler */

// Dependencies
const queryString = require('querystring')

const helpers = require('../helpers')
const config = require('../config')

const checkoutHandler = {}

checkoutHandler.checkout = (data, callBack) => {
  const acceptableMethods = ['post']
  return helpers.requestDispatcher(
    data, callBack, acceptableMethods, checkoutHandler._checkout)
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
checkoutHandler._checkout.post = (data, callBack) => {
  // Get token from header
  const tokenId = helpers.validate(data.headers.token)
  const orderId = helpers.validate(data.payload.orderId)
  const stripeToken = helpers.validate(data.payload.stripeToken)

  if (tokenId) {
    if (orderId && stripeToken) {
      helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        if (tokenObject.expires > Date.now()) {
          // Get user email
          helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
            .then(fileNames => {
              if (!fileNames.length) {
                // No file in users directory
                callBack(400, {'Error': 'User not found.'})
              } else {
                fileNames.forEach(fileName => {
                  const email = fileName.slice(0, -5)
                  if (email === tokenObject.email) {
                    // Get order
                    helpers.readFile(helpers.filePath(helpers.baseDir,
                      'orders', orderId), 'utf8')
                      .then(order => {
                        const orderObject = helpers.parseJsonToObject(order)

                        const stripePayload = queryString.stringify({
                          amount: Math.round(orderObject.totalPrice * 100),
                          currency: 'usd',
                          description: `${email}_${tokenId}_${Date.now()}`,
                          source: stripeToken
                        })

                        helpers.sendRequest(stripePayload, 'api.stripe.com', '/v1/charges',
                          `Bearer ${config.stripeKey}`, (err, data) => {
                          if (!err) {
                            orderObject.paid = true
                          }
                        })

                        helpers.openFile(helpers.filePath(helpers.baseDir,
                          'orders', orderId), 'w')
                          .then(fileDescriptor => {
                            helpers.writeFile(fileDescriptor, JSON.stringify(orderObject))
                              .catch(err => callBack(500, {'Error': err.toString()}))
                            callBack(200, {'Success': 'Payment processed and user notified successfully.'})
                          })
                          .catch(err => callBack(500, {'Error': err.toString()}))
                      })
                      .catch(err => callBack(500, {'Error': err.toString()}))
                  }
                })
              }
            })
        } else {
          callBack(400, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch()
    } else {
      callBack(400, {'Error': 'Required fields missing.'})
    }
  } else {
    callBack(401, {'Error': 'Authentication token not provided.'})
  }
  
}


module.exports = checkoutHandler 