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
          // Get user
          helpers.readDir(helpers.filePath(helpers.baseDir, 'users'))
            .then(fileNames => {
              if (!fileNames.length) {
                // No file in users directory
                callBack(400, {'Error': 'User not found.'})
              } else {
                fileNames.forEach(fileName => {
                  const email = fileName.slice(0, -5)
                  if (email === tokenObject.email) {
                    // Get order - we can get this from this user object
                    // since it has a list of order objects.
                    helpers.readFile(helpers.filePath(helpers.baseDir,
                      'users', email), 'utf8')
                      .then(user => {
                        const userObject = helpers.parseJsonToObject(user)
                        userObject.orders.forEach(order => {
                          if (order.id === orderId) {
                            const stripeRequestObject = {
                              amount: Math.round(order.value * 100),
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
                              console.log(`statusCode: ${res.statusCode}`)
                            
                              res.on('data', d => {
                                console.log(`${d}`)
                                callBack(res.statusCode, `${d}`)
                              })
                            })
                            
                            req.on('error', error => {
                              console.error(error)
                            })
                            
                            req.write(requestString)
                            req.end()
                          }
                        })
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