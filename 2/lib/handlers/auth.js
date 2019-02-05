/* Auth handlers */

// Dependencies
const helpers = require('../helpers')

const authHandler = {}

authHandler.login = (data, callback) => {
  const acceptableMethods = ['post']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, authHandler._login)
}

authHandler.logout = (data, callback) => {
  const acceptableMethods = ['post']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, authHandler._logout)
}

authHandler._login = {}
authHandler._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
authHandler._login.post = (data, callback) => {
  const email = helpers.validate(data.payload.email)
  const password = helpers.validate(data.payload.password)

  if (email && password) {
    // Lookup user with email
    helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then((data) => {
        data = helpers.parseJsonToObject(data)
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password)

        if (hashedPassword === data.hashedPassword) {
          // Check if user has a token
          helpers.getToken(email)
            .then((data) => {
              // If user has a token
              const token = helpers.parseJsonToObject(data)
              // check validity
              if (token.expires < Date.now()) {
                // if token is invalid, delete it
                helpers.deleteToken(email)
                  .catch((err) => {
                    console.log(err)
                    callback(400, {'Error': 'Unable to delete token'})
                  })
                // and create a new one
                helpers.createToken(email, callback)
              } else {
                // else, return it
                callback(200, token)
              }
            })
            .catch((err) => {
              // Else
              // - create one
              helpers.createToken(email, callback)
            })
        } else {
          callback(400, {
            'Error': "Password did not match the specified user's stored password"
          })
        }
      })
      .catch((err) => {
        console.log(err)
        callback(400, {'Error': 'User does not exist'})
      })
  }
}

// Logout - post
// Required data: tokenId
// Optional data: none
authHandler._logout.post = (data, callback) => {
  const tokenId = typeof data.headers.token == 'string' ? data.headers.token : false
  if (tokenId) {
    helpers.deleteTokenById(tokenId, callback)
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
}


module.exports = authHandler