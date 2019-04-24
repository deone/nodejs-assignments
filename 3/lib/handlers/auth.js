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
        const user = helpers.parseJsonToObject(data)
        if (helpers.hash(password) !== user.hashedPassword) {
          callBack(400, {
            'Error': "Password did not match the user's stored password."
          })
          return
        }

        // Check if user has a token
        helpers.readDir(helpers.tokenDir())
          .then(xs => {
            if (!xs.length) {
              // First case - no tokens
              createAuthToken(
                helpers.createRandomString(20)
              )
              return
            }

            // There are token files
            // Get all tokens
            const promises = helpers.map(
              helpers.getItem(helpers.tokenDir)
            )(xs)

            const p = Promise.all(promises)
            p
              .then(
                xs => {
                  const tokens =
                    helpers
                      .map(helpers.parseJsonToObject)(xs)

                  // Extract email from tokens
                  const getEmail = x => x.email
                  const emails = helpers.map(getEmail)(tokens)

                  const userHasToken = !emails.includes(email) ? false : true
                  if (!userHasToken) {
                    // Second case - user does not have token
                    createAuthToken(helpers.createRandomString(20))
                    return
                  }

                  // Third case - user has token
                  const findToken = token => token.email === email
                  const token = helpers.find(findToken)(tokens)

                  Date.now() > token.expires
                    // if token is expired, delete and create another
                    ? helpers.delete(helpers.tokenDir)(token.tokenId)
                        .then(() => createAuthToken(
                          helpers.createRandomString(20)
                        ))
                        .catch(err => callBack(500, {
                          'Error': err.toString()
                        }))

                    // else, return it
                    : callBack(200, token)
                }
              )
              .catch(err => callBack(500, {
                'Error': err.toString()
              }))
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
authHandler._logout.post = callBack =>
  data => {
    const [tokenId] = helpers.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    helpers.delete(helpers.tokenDir)(tokenId)
      .then(callBack(
        200, {'Success': 'User logged out.'}
      ))
      .catch(err => callBack(500, {
        'Error': err.toString()
      }))
  }


module.exports = authHandler