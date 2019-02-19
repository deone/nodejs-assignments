/* Checkout handler */

// Dependencies
const https = require('https')
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
                        console.log(orderObject)
                        const stripeRequestObject = {
                          amount: Math.round(orderObject.totalPrice * 100),
                          currency: 'usd',
                          description: `${email}_${tokenId}_${Date.now()}`,
                          source: stripeToken
                        }
                        const requestString = queryString.stringify(stripeRequestObject)

                        const options = {
                          hostname: 'api.stripe.com',
                          port: 443,
                          path: '/v1/charges',
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${config.stripeKey}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': Buffer.byteLength(requestString)
                          }
                        }

                        const req = https.request(options, res => {
                          console.log(`Stripe payment status code: ${res.statusCode}`)
                        
                          res.on('data', d => {
                            console.log(`${d}`)
                            // Update order object
                            if (res.statusCode === 200) {
                              orderObject.paid = true
                              helpers.openFile(helpers.filePath(helpers.baseDir,
                                'orders', orderId), 'w')
                                .then(fileDescriptor => {
                                  helpers.writeFile(fileDescriptor, JSON.stringify(orderObject))
                                    .catch(err => callBack(500, {'Error': err.toString()}))
                                  callBack(200, {'Success': 'Payment processed successfully.'})
                                })
                                .catch(err => callBack(500, {'Error': err.toString()}))
                            }
                          })
                        })
                        
                        req.on('error', error => {
                          console.error(error)
                        })
                        
                        req.write(requestString)
                        req.end()
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