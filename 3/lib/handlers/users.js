/* Users handlers */

// Dependencies
const helpers = require('../helpers')

const userHandler = {}

userHandler.users = (data, callback) =>
  helpers.requestDispatcher(
    data, callback,
    ['post', 'get', 'put', 'delete'],
    userHandler._users
  )

// Container for user methods
userHandler._users = {}

// Users - post
// Required data: firstName, lastName,
// email, streetAddress, password
// Optional data: none
userHandler._users.post = (data, callBack) => {
  // Check that all required fields are filled out
  const [
    firstName,
    lastName,
    email,
    password,
    streetAddress
  ] = helpers.validate(
    data.payload.firstName,
    data.payload.lastName,
    data.payload.email,
    data.payload.password,
    data.payload.streetAddress
  )

  if (!(firstName && lastName &&  email &&  streetAddress &&  password)) {
    callBack(400, {'Error': 'Missing required fields.'})
    return
  }

  helpers.readFile(
    helpers.filePath(
      helpers.baseDir, 'users', email
    ),
    'utf8'
  )
    .then(user => callBack(400, {
      'Error': 'User already exists.'
    }))
    .catch(err => {
      // Hash password
      const hashedPassword = helpers.hash(password)

      // Create the user object
      if (hashedPassword) {
        const userObject = {
          firstName,
          lastName,
          email,
          streetAddress,
          hashedPassword
        }

        // Store the user
        helpers.writeUser(email, userObject, 'wx', callBack)
      }
    })
}

// Users - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access
// their object. Dont let them access anyone elses.
userHandler._users.get = (data, callBack) => {
  // Validate email - do this properly, maybe with regex
  const [email] = helpers.validate(data.queryStringObject.email)
  if (!email) {
    callBack(400, {'Error': 'Missing required field.'})
    return
  }

  // Look up user
  helpers.readFile(
    helpers.filePath(
      helpers.baseDir, 'users', email
    ),
    'utf8'
  )
    .then(data => {
      const userObject = helpers.parseJsonToObject(data)
      delete userObject.hashedPassword
      callBack(200, userObject)
    })
    .catch(err => {
      const errorString = err.toString()
      errorString.includes('no such file or directory')
        ? callBack(404, {
          'Error': 'User does not exist.'
        })
        : callBack(500, {
          'Error': err.toString()
        })
    })
}

// Users - put
// Required data: email
// Optional data: firstName, lastName, streetAddress,
// password (at least one must be specified)
// @TODO Only let an authenticated user up their object.
// Dont let them access update elses.
userHandler._users.put = (data, callback) => {
  // Validate required field 
  const [email] = helpers.validate(data.payload.email)

  // Validate optional fields, if provided
  const [
    firstName,
    lastName,
    password,
    streetAddress
  ] = helpers.validate(
    data.payload.firstName,
    data.payload.lastName,
    data.payload.password,
    data.payload.streetAddress
  )

  if(!email) {
    callback(400, {'Error': 'Missing required field.'})
    return
  }

  if (!(firstName || lastName || streetAddress || password)) {
    callback(400, {'Error': 'Missing fields to update.'})
    return
  }

  helpers.getUser(email)
    .then(data => {
      const input = { firstName, lastName, streetAddress, password }

      // Filter fields that
      // don't have values and
      // shouldn't be updated
      const filteredInput = Object.entries(input)
        .filter(item => item[1] !== false)
        .reduce((acc, item) => {
          acc[item[0]] = item[1]
          return acc
        }, {})

      // Update fields if necessary
      const userObject = helpers.parseJsonToObject(data)
      Object.assign(userObject, filteredInput)

      // Store updates
      helpers.writeUser(email, userObject, 'w', callback)
    })
    .catch(err => {
      console.log(err)
      callback(404, {'Error': 'User does not exist.'})
    })
}

// Users - delete
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user delete their object.
// Don't let them delete or update someone elses.
// @TODO Cleanup (delete) any other data files associated with the user
userHandler._users.delete = (data, callBack) => {
  // Validate email
  const [email] = helpers.validate(data.queryStringObject.email)
  if (!email) {
    callBack(400, {'Error': 'Missing required field.'})
    return
  }
  helpers.deleteUser(email)
    .then(() => callBack(200, {
      'Success': 'User deleted successfully.'
    }))
    .catch(err => {
      const errorString = err.toString()
      errorString.includes('no such file or directory')
        ? callBack(404, {'Error': 'User does not exist.'})
        : callBack(500, {'Error': err.toString()})
    })
}


module.exports = userHandler