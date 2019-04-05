/* Users handlers */

// Dependencies
const helpers = require('../helpers')

const userHandler = {}

userHandler.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, userHandler._users)
}

// Container for user methods
userHandler._users = {}

// Users - post
// Required data: firstName, lastName, email, streetAddress, password
// Optional data: none
userHandler._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const email = helpers.validate(data.payload.email)
  const password = helpers.validate(data.payload.password)
  const streetAddress = helpers.validate(data.payload.streetAddress)

  if (firstName && lastName && email && streetAddress && password) {
    helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(user => callback(400, {'Error': 'User already exists.'}))
      .catch(err => {
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
          helpers.writeUser(email, userObject, 'wx', callback)
        }
      })
  } else {
    callback(400, {'Error': 'Missing required fields.'})
  }
}

// Users - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let them access anyone elses.
userHandler._users.get = (data, callBack) => {
  // Validate email - do this properly, maybe with regex
  const email = helpers.validate(data.queryStringObject.email)
  if (email) {
    // Look up user
    helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(data => {
        const userObject = helpers.parseJsonToObject(data)
        delete userObject.hashedPassword
        callBack(200, userObject)
      })
      .catch(err => {
        const errorString = err.toString()
        if (errorString.includes('no such file or directory')) {
          callBack(404, {'Error': 'User does not exist.'})
        } else {
          callBack(500, {'Error': err.toString()})
        }
      })
  } else {
    callBack(400, {'Error': 'Missing required field.'})
  }
}

// Users - put
// Required data: email
// Optional data: firstName, lastName, streetAddress, password (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
userHandler._users.put = (data, callback) => {
  // Validate required field 
  const email = helpers.validate(data.payload.email)

  // Validate optional fields, if provided
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const streetAddress = helpers.validate(data.payload.streetAddress)
  const password = helpers.validate(data.payload.password)

  if(!email) {
    callback(400, {'Error': 'Missing required field.'})
  } else {
    if(firstName || lastName || streetAddress || password) {
      helpers.getUser(email)
        .then(data => {
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
          helpers.writeUser(email, userObject, 'w', callback)
        })
        .catch(err => {
          console.log(err)
          callback(404, {'Error': 'User does not exist.'})
        })
    } else {
      callback(400, {'Error': 'Missing fields to update.'})
    }
  }
}

// Users - delete
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user delete their object. Don't let them delete or update someone elses.
// @TODO Cleanup (delete) any other data files associated with the user
userHandler._users.delete = (data, callBack) => {
  // Validate email
  const email = helpers.validate(data.queryStringObject.email)
  if (email) {
    helpers.deleteUser(email)
      .then(() => callBack(200, {'Success': 'User deleted successfully.'}))
      .catch(err => {
        const errorString = err.toString()
        if (errorString.includes('no such file or directory')) {
          callBack(404, {'Error': 'User does not exist.'})
        } else {
          callBack(500, {'Error': err.toString()})
        }
      })
  } else {
    callBack(400, {'Error': 'Missing required field.'})
  }
}


module.exports = userHandler