/* Auth handlers */

// Dependencies
const helpers = require('../helpers')

const authHandler = {}

authHandler.login = (data, callBack) =>
  helpers.requestDispatcher(
    data, callBack, ['post'], authHandler._login
  )

authHandler.logout = (data, callBack) =>
  helpers.requestDispatcher(
    data, callBack, ['post'], authHandler._logout
  )

authHandler._login = {}
authHandler._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
authHandler._login.post = (data, callBack) => {
  const email = helpers.validate(data.payload.email)
  const password = helpers.validate(data.payload.password)

  email && password
    // Lookup user with email
    ? helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(data => {
        const userObject = helpers.parseJsonToObject(data)
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password)

        hashedPassword === userObject.hashedPassword
          // Check if user has a token
          // Read tokens directory
          ? helpers.readDir(helpers.filePath(helpers.baseDir, 'tokens'))
            .then(fileNames => {
              if (!fileNames.length) {
                console.log('No token files')
                // No token files, create one
                const tokenId = helpers.createRandomString(20)
                helpers.createToken(tokenId, email, callBack)
              } else {
                // There are token files
                // Loop through list of file names
                let promises = []
                fileNames.forEach(fileName => {
                  const tokenId = fileName.slice(0, -5)
                  promises.push(
                    helpers.getToken(tokenId)
                      .then(token => helpers.parseJsonToObject(token))
                      .catch(err => callBack(500, {'Error': err.toString()}))
                  )
                })
                Promise.all(promises).then(listOfTokens => {
                  const listOfTokenEmails = listOfTokens.map(token => token.email)

                  if (!listOfTokenEmails.includes(email)) {
                    console.log('User does not have token')
                    const tokenId = helpers.createRandomString(20)
                    helpers.createToken(tokenId, email, callBack)
                  } else {
                    console.log('User has token')
                    // User has token
                    // Check validity
                    const tokenObject = listOfTokens.find(token => token.email === email)
                    tokenObject.expires < Date.now()
                      // if token is invalid, delete it
                      ? helpers.deleteToken(tokenObject.tokenId)
                        .then(() => {
                          // and create a new one
                          const tokenId = helpers.createRandomString(20)
                          helpers.createToken(tokenId, email, callBack)
                        })
                        .catch(err => callBack(500, {'Error': err.toString()}))
                      // else, return it
                      : callBack(200, tokenObject)
                  }
                })
              }
            })
            .catch(err => callBack(500, {'Error': err.toString()}))
          : callBack(400, {
              'Error': "Password did not match the specified user's stored password."
            })
      })
      .catch(err => {
        console.log(err)
        callBack(404, {'Error': 'User does not exist.'})
      })
    : callBack(400, {'Error': 'Missing required fields.'})
}

// Logout - post
// Required data: tokenId
// Optional data: none
authHandler._logout.post = (data, callBack) => {
  // We need to verify token belongs to user before we delete
  // At the moment, we just delete whatever token is provided
  const tokenId = helpers.validate(data.headers.token)
  if (tokenId) {
    helpers.deleteToken(tokenId)
      .then(callBack(200, {'Success': 'User logged out.'}))
      .catch(err => callBack(500, {'Error': err.toString()}))
  } else {
    callBack(401, {'Error' : 'Authentication token not provided.'});
  }
}


module.exports = authHandler