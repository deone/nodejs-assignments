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
        const userObject = helpers.parseJsonToObject(data)
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password)

        if (hashedPassword === userObject.hashedPassword) {
          // Check if user has a token
          // Read tokens directory
          helpers.readDir(helpers.filePath(helpers.baseDir, 'tokens'))
            .then((fileNames) => {
              if (!fileNames.length) {
                // No token files, create one
                const tokenId = helpers.createRandomString(20)
                helpers.createToken(tokenId, email, callback)
              } else {
                // There are token files
                // Loop through list of file names
                fileNames.forEach((fileName) => {
                  // Get token object from each file
                  helpers.getToken(fileName.slice(0, -5))
                    .then((token) => {
                      const tokenObject = helpers.parseJsonToObject(token)
                      // Token belongs to user if
                      // email stored in token matches email provided
                      if (tokenObject.email === email) {
                        // If user has a token
                        // check validity
                        if (tokenObject.expires < Date.now()) {
                          // if token is invalid, delete it
                          helpers.deleteToken(tokenObject.tokenId)
                            .catch((err) => {
                              console.log(err)
                              callback(500, {'Error': 'Unable to delete token'})
                            })
                          // and create a new one
                          const tokenId = helpers.createRandomString(20)
                          helpers.createToken(tokenId, email, callback)
                        } else {
                          // else, return it
                          callback(200, tokenObject)
                        }
                      }
                    })
                    .catch((err) => {
                      console.log(err)
                      callback(500, {'Error': 'Unable to get token'})
                    })
                })
              }
            })
            .catch((err) => {
              console.log(err)
              callback(500, {'Error': 'Unable to read tokens directory'})
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
    helpers.deleteToken(tokenId)
      .then(callback(200, {'Success': 'User logged out'}))
      .catch((err) => {
        console.log(err)
        callback(500, {'Error': 'Unable to log user out. Cannot delete token'})
      })
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
}


module.exports = authHandler