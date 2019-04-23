/* Auth handlers */

// Dependencies
const helpers = require('../helpers')

const authHandler = {}

authHandler.login = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(authHandler._login)
    dispatch(['post'])(data)
  }

authHandler.logout = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(authHandler._logout)
    dispatch(['post'])(data)
  }

authHandler._login = {}
authHandler._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
authHandler._login.post = callBack =>
  data => {
    const [email, password] = helpers.validate([
      data.payload.email,
      data.payload.password
    ])

    if (!(email && password)) {
      callBack(400, {'Error': 'Missing required fields.'})
      return
    }

    const createAuthToken = helpers.createToken(callBack)(email)

    // Lookup user with email
    helpers.readFile(helpers.userDir(email), 'utf8')
      .then(data => {
        const userObject = helpers.parseJsonToObject(data)
        // Hash the sent password, and compare it to
        // the password stored in the user object
        const hashedPassword = helpers.hash(password)

        if (!(hashedPassword === userObject.hashedPassword)) {
          callBack(400, {
            'Error': "Password did not match the user's stored password."
          })
          return
        }

        // Check if user has a token
        // Read tokens directory
        helpers.readDir(helpers.tokenDir())
          .then(fileNames => {
            if (!fileNames.length) {
              console.log('No token files')
              // No token files, create one
              const tokenId = helpers.createRandomString(20)
              createAuthToken(tokenId)
            } else {
              // There are token files
              // Loop through list of file names
              const promises = fileNames.map(fileName => {
                const tokenId = fileName.slice(0, -5)
                return helpers.getToken(tokenId)
                        .then(token =>
                          helpers.parseJsonToObject(token))
                        .catch(err => callBack(500, {
                          'Error': err.toString()
                        }))
              })

              Promise.all(promises).then(tokens => {
                const emails = tokens.map(
                  token => token.email
                )

                if (!emails.includes(email)) {
                  console.log('User does not have token')
                  const tokenId = helpers.createRandomString(20)
                  createAuthToken(tokenId)
                } else {
                  console.log('User has token')
                  // User has token
                  // Check validity
                  const tokenObject = tokens.find(
                    token => token.email === email
                  )

                  tokenObject.expires < Date.now()
                    // if token is invalid, delete it
                    ? helpers.deleteToken(tokenObject.tokenId)
                      .then(() => {
                        // and create a new one
                        const tokenId = helpers.createRandomString(20)
                        createAuthToken(tokenId)
                      })
                      .catch(err => callBack(500, {
                        'Error': err.toString()
                      }))

                    // else, return it
                    : callBack(200, tokenObject)
                }
              })
            }
          })
          .catch(err => callBack(500, {
            'Error': err.toString()
          }))
      })
      .catch(err => {
        console.log(err)
        callBack(404, {'Error': 'User does not exist.'})
      })
  }

// Logout - post
// Required data: tokenId
// Optional data: none
authHandler._logout.post = (data, callBack) => {
  const [tokenId] = helpers.validate([data.headers.token])

  if (!helpers.isTokenProvided(
    tokenId, callBack)) {
    return
  }

  helpers.deleteToken(tokenId)
    .then(callBack(
      200, {'Success': 'User logged out.'}
    ))
    .catch(err => callBack(500, {
      'Error': err.toString()
    }))
}


module.exports = authHandler