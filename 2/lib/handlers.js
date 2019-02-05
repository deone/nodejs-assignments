/* Request Handlers */

// Dependencies
const helpers = require('./helpers')


const handlers = {}

handlers.notFound = (data, callback) => callback(404, 'Not Found')

// User handlers
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, handlers._users)
}

// Container for user methods
handlers._users = {}

// Users - post
// Required data: firstName, lastName, email, streetAddress, password
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const email = helpers.validate(data.payload.email)
  const password = helpers.validate(data.payload.password)
  const streetAddress = helpers.validate(data.payload.streetAddress)

  if (firstName && lastName && email && streetAddress && password) {
    helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(console.log)
      .catch((err) => {
        // Hash password
        const hashedPassword = helpers.hash(password)

        // Create the user object
        if(hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            email,
            streetAddress,
            hashedPassword
          }

          // Store the user
          helpers.writeObject(email, userObject, 'create', 'users', callback)
        }
      })
  } else {
    callback(400, {'Error': 'Missing required fields'})
  }
}

// Users - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
handlers._users.get = (data, callback) => {
  // Validate email - do this properly, maybe with regex
  const email = helpers.validate(data.queryStringObject.email)
  if (email) {
    // Look up user
    helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then((data) => {
        data = helpers.parseJsonToObject(data)
        delete data.hashedPassword
        callback(200, data)
      })
      .catch((err) => callback(404))
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Users - put
// Required data: email
// Optional data: firstName, lastName, streetAddress, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data, callback) => {
  // Validate required field 
  const email = helpers.validate(data.payload.email)

  // Validate optional fields, if provided
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const streetAddress = helpers.validate(data.payload.streetAddress)
  const password = helpers.validate(data.payload.password)

  if(!email) {
    callback(400, {'Error': 'Missing required field'})
  } else {
    if(firstName || lastName || streetAddress || password) {
      helpers.getUser(email)
        .then((data) => {
          // Update fields if necessary
          const userObject = helpers.parseJsonToObject(data)

          if (firstName)
            userObject.firstName = firstName

          if (lastName)
            userObject.lastName = lastName

          if (streetAddress)
            userObject.streetAddress = streetAddress

          if (password)
            userObject.hashedPassword = helpers.hash(password)

          // Store updates
          helpers.writeObject(email, userObject, 'update', 'users', callback)
        })
        .catch((err) => {
          console.log(err)
          callback(400, {'Error': 'User does not exist'})
        })
    } else {
      callback(400, {'Error': 'Missing fields to update'})
    }
  }
}

// Users - delete
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
  // Validate email
  const email = helpers.validate(data.queryStringObject.email)
  if (email) {
    helpers.deleteUser(email)
      .then(() => callback(200, {'Success': 'User deleted successfully'}))
      .catch((err) => {
        console.log(err)
        callback(500, {'Error': 'Could not delete user'})
      })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

handlers.login = (data, callback) => {
  const acceptableMethods = ['post']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, handlers._login)
}

handlers.logout = (data, callback) => {
  const acceptableMethods = ['post']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, handlers._logout)
}

handlers._login = {}
handlers._logout = {}

// Login - post
// Required data: email, password
// Optional data: none
handlers._login.post = (data, callback) => {
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
handlers._logout.post = (data, callback) => {
  const tokenId = typeof data.headers.token == 'string' ? data.headers.token : false
  if (tokenId) {
    helpers.deleteTokenById(tokenId, callback)
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
}


module.exports = handlers