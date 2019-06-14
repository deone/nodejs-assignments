/* Auth handler */

// Dependencies
const {
  request,
  validate,
  crypto,
  io,
  fp,
  dir,
  json,
  errors
} = require('../utils')

const authHandler = {}

authHandler.login = callBack =>
  data => {
    const dispatch = request.dispatch(callBack)(authHandler._login)
    dispatch(['post'])(data)
  }

authHandler.logout = callBack =>
  data => {
    const dispatch = request.dispatch(callBack)(authHandler._logout)
    dispatch(['post'])(data)
  }

authHandler._login = {}
authHandler._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
authHandler._login.post = callBack =>
  data => {
    const [email, password] = validate([
      data.payload.email,
      data.payload.password
    ])

    if (!(email && password)) {
      callBack(400, {'Error': errors.MISSING_REQUIRED_FIELDS})
      return
    }

    const createToken = crypto.createToken(callBack)(email)

    // Lookup user with email
    io.readFile(dir.users(email), 'utf8')
      .then(u => {
        const user = json.toObject(u)
        if (crypto.hash(password) !== user.hashedPassword) {
          callBack(400, {
            'Error': "Password did not match the user's stored password."})
          return
        }

        // Check if user has a token
        io.readDir(dir.tokens())
          .then(xs => {
            if (!xs.length) {
              // First case - no tokens in directory
              const token = createToken(crypto.createRandomString(20))
              callBack(200, token)
              return
            }

            // There are token files
            // Get all tokens
            const promises = fp.map(
              io.getByFileName(dir.tokens)
            )(xs)

            const p = Promise.all(promises)
            p
              .then(
                xs => {
                  const tokens = fp.map(json.toObject)(xs)

                  // Extract email from tokens
                  const getEmail = x => x.email
                  const emails = fp.map(getEmail)(tokens)

                  const userHasToken = !emails.includes(email) ? false : true
                  if (!userHasToken) {
                    // Second case - user does not have token
                    const token = createToken(crypto.createRandomString(20))
                    callBack(200, token)
                    return
                  }

                  // Third case - user has token
                  const findToken = token => token.email === email
                  const token = fp.find(findToken)(tokens)

                  Date.now() > token.expires
                    // if token is expired, delete and create another
                    ? io.delete(dir.tokens)(token.id)
                        .then(() => {
                          const token = createToken(crypto.createRandomString(20))
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
      .catch(err => callBack(404, {'Error': 'User does not exist.'}))
  }

// Logout - post
// Required data: tokenId
// Optional data: none
authHandler._logout.post = callBack =>
  data => {
    const [tokenId] = validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    io.delete(dir.tokens)(tokenId)
      .then(callBack(
        200, {'Success': 'User logged out.'}
      ))
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = authHandler