/* Auth handlers */

// Dependencies
const utils = require('../utils')

const authHandler = {}

authHandler.login = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(authHandler._login)
    dispatch(['post'])(data)
  }

authHandler.logout = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(authHandler._logout)
    dispatch(['post'])(data)
  }

authHandler._login = {}
authHandler._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
authHandler._login.post = callBack =>
  data => {
    const [email, password] = utils.validate([
      data.payload.email,
      data.payload.password
    ])

    if (!(email && password)) {
      callBack(400, {'Error': 'Missing required fields.'})
      return
    }

    const createToken = utils.createToken(callBack)(email)

    // Lookup user with email
    utils.readFile(utils.userDir(email), 'utf8')
      .then(u => {
        const user = utils.parseJsonToObject(u)
        if (utils.hash(password) !== user.hashedPassword) {
          callBack(400, {
            'Error': "Password did not match the user's stored password."})
          return
        }

        // Check if user has a token
        utils.readDir(utils.tokenDir())
          .then(xs => {
            if (!xs.length) {
              // First case - no tokens in directory
              const token = createToken(utils.createRandomString(20))
              callBack(200, token)
              return
            }

            // There are token files
            // Get all tokens
            const promises = utils.map(
              utils.getByFileName(utils.tokenDir)
            )(xs)

            const p = Promise.all(promises)
            p
              .then(
                xs => {
                  const tokens =
                    utils
                      .map(utils.parseJsonToObject)(xs)

                  // Extract email from tokens
                  const getEmail = x => x.email
                  const emails = utils.map(getEmail)(tokens)

                  const userHasToken = !emails.includes(email) ? false : true
                  if (!userHasToken) {
                    // Second case - user does not have token
                    const token = createToken(utils.createRandomString(20))
                    callBack(200, token)
                    return
                  }

                  // Third case - user has token
                  const findToken = token => token.email === email
                  const token = utils.find(findToken)(tokens)

                  Date.now() > token.expires
                    // if token is expired, delete and create another
                    ? utils.delete(utils.tokenDir)(token.id)
                        .then(() => {
                          const token = createToken(utils.createRandomString(20))
                          callBack(200, token)
                        })
                        .catch(err =>
                          callBack(500, {'Error': err.toString()}))
                    // else, return it
                    : callBack(200, token)
                }
              )
              .catch(err =>
                callBack(500, {'Error': err.toString()}))
          })
          .catch(err =>
            callBack(500, {'Error': err.toString()}))
      })
      .catch(err => {
        console.log(err)
        callBack(404, {'Error': 'User does not exist.'})})
  }

// Logout - post
// Required data: tokenId
// Optional data: none
authHandler._logout.post = callBack =>
  data => {
    const [tokenId] = utils.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    utils.delete(utils.tokenDir)(tokenId)
      .then(callBack(
        200, {'Success': 'User logged out.'}
      ))
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = authHandler