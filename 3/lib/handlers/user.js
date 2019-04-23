/* User handlers */

// Dependencies
const helpers = require('../helpers')

const userHandler = {}

userHandler.user = (data, callback) =>
  helpers.requestDispatcher(
    data, callback,
    ['post', 'get', 'put', 'delete'],
    userHandler._user
  )

// Container for user methods
userHandler._user = {}

// User - post
// Required data: firstName, lastName,
// email, streetAddress, password
// Optional data: none
userHandler._user.post = (data, callBack) => {
  // Check that all required fields are filled out
  const [
    firstName,
    lastName,
    email,
    password,
    streetAddress
  ] = helpers.validate([
    data.payload.firstName,
    data.payload.lastName,
    data.payload.email,
    data.payload.password,
    data.payload.streetAddress
  ])

  if (!(firstName && lastName &&  email &&  streetAddress &&  password)) {
    callBack(400, {'Error': 'Missing required fields.'})
    return
  }

  helpers.readFile(
    helpers.userDir(email),
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

// User - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access
// their object. Dont let them access anyone elses.
userHandler._user.get = (data, callBack) => {
  // Validate email - do this properly, maybe with regex
  const [email] = helpers.validate([data.queryStringObject.email])

  if (!helpers.isRequiredFieldProvided(
    email, callBack)) {
    return
  }

  // Look up user
  helpers.readFile(
    helpers.userDir(email),
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

// User - put
// Required data: email
// Optional data: firstName, lastName, streetAddress,
// password (at least one must be specified)
// @TODO Only let an authenticated user up their object.
// Dont let them access update elses.
userHandler._user.put = (data, callBack) => {
  // Validate required field 
  const [email] = helpers.validate([data.payload.email])

  // Validate optional fields, if provided
  const [
    firstName,
    lastName,
    password,
    streetAddress
  ] = helpers.validate([
    data.payload.firstName,
    data.payload.lastName,
    data.payload.password,
    data.payload.streetAddress
  ])

  if (!helpers.isRequiredFieldProvided(
    email, callBack)) {
    return
  }

  if (!(firstName || lastName || streetAddress || password)) {
    callBack(400, {'Error': 'Missing fields to update.'})
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
      helpers.writeUser(email, userObject, 'w', callBack)
    })
    .catch(err => {
      console.log(err)
      callBack(404, {'Error': 'User does not exist.'})
    })
}

// User - delete
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user delete their object.
// Don't let them delete or update someone elses.
// @TODO Cleanup (delete) any other data files associated with the user
userHandler._user.delete = (data, callBack) => {
  // Validate email
  const [email] = helpers.validate([data.queryStringObject.email])

  if (!helpers.isRequiredFieldProvided(
    email, callBack)) {
    return
  }

  helpers.deleteUser(email)
    .then(() => callBack(200, {
      'Success': 'User deleted successfully.'
    }))
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


module.exports = userHandler