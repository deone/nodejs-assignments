/* User handlers */

// Dependencies
const {
  request,
  validate,
  io,
  dir,
  crypto,
  errors,
  json,
  fp
} = require('../utils')

const userHandler = {}

userHandler.user = callback =>
  data => {
    const dispatch =
      request.dispatch(callback)(userHandler._user)
    dispatch(['post', 'get', 'put', 'delete'])(data)
  }

// Container for user methods
userHandler._user = {}

// User - post
// Required data: firstName, lastName,
// email, streetAddress, password
// Optional data: none
userHandler._user.post = callback =>
  data => {
    // Check that all required fields are filled out
    const [
      firstName,
      lastName,
      email,
      password,
      streetAddress
    ] = validate([
      data.payload.firstName,
      data.payload.lastName,
      data.payload.email,
      data.payload.password,
      data.payload.streetAddress
    ])

    if (!(firstName && lastName &&  email &&  streetAddress &&  password)) {
      callback(400, {'Error': 'Missing required fields.'})
      return
    }

    io.readFile(
      dir.users(email),
      'utf8'
    )
      .then(u => callback(400, {
        'Error': 'User already exists.'
      }))
      .catch(err => {
        // Hash password
        const hashedPassword = crypto.hash(password)

        // Create user
        if (hashedPassword) {
          const user = {
            firstName,
            lastName,
            email,
            streetAddress,
            hashedPassword
          }

          // Store the user
          io.writeUser(user)
            .then(callback(201, {'Success': 'User created successfully.'}))
            .catch(err => callback(500, {'Error': err.toString()}))
        }
      })
  }

// User - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access
// their object. Dont let them access anyone elses.
userHandler._user.get = callback =>
  data => {
    // Validate email - do this properly, maybe with regex
    const [email] = validate([data.queryStringObject.email])

    if (!email) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Look up user
    io.readFile(
      dir.users(email),
      'utf8'
    )
      .then(u => {
        const user = json.toObject(u)
        delete user.hashedPassword
        callback(200, user)
      })
      .catch(err => {
        const errorString = err.toString()
        errorString.includes('no such file or directory')
          ? callback(404, {
              'Error': 'User does not exist.'
            })
          : callback(500, {
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
userHandler._user.put = callback =>
  data => {
    // Validate required field
    const [email] = validate([data.payload.email])

    // Validate optional fields, if provided
    const [
      firstName,
      lastName,
      password,
      streetAddress
    ] = validate([
      data.payload.firstName,
      data.payload.lastName,
      data.payload.password,
      data.payload.streetAddress
    ])

    if (!email) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    if (!(firstName || lastName || streetAddress || password)) {
      callback(400, {'Error': 'Missing fields to update.'})
      return
    }

    io.get(dir.users)(email)
      .then(u => {
        const user = json.toObject(u)
        const input = { firstName, lastName, streetAddress, password }

        // Update input with hashed password
        if (input.password !== false) {
          input.hashedPassword = crypto.hash(input.password)
        }

        const notPasswordField = item => item[0] !== 'password'
        const notFalse = item => item[1] !== false

        const objectify = (obj, item) => {
          obj[item[0]] = item[1]
          return obj
        }

        // Remove password field
        // Remove fields that don't have values
        // Make object from resulting array
        const getFieldsToUpdate = fp.compose(
          fp.reduce(objectify)({}),
          fp.compose(
            fp.filter(notFalse),
            fp.filter(notPasswordField)
          )
        )
        const fields = getFieldsToUpdate(Object.entries(input))

        // Update fields if necessary
        Object.assign(user, fields)

        // Store updates
        io.writeUser(user)
          .then(callback(200, {'Success': 'User updated successfully.'}))
          .catch(err => callback(500, {'Error': err.toString()}))
      })
      .catch(err => {
        console.log(err)
        callback(404, {'Error': 'User does not exist.'})
      })
  }

// User - delete
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user delete their object.
// Don't let them delete or update someone elses.
// @TODO Cleanup (delete) any other data files associated with the user
userHandler._user.delete = callback =>
  data => {
    // Validate email
    const [email] = validate([data.queryStringObject.email])

    if (!email) {
      callback(400, {'Error': errors.MISSING_REQUIRED_FIELD})
      return
    }

    io.delete(dir.users)(email)
      .then(() => callback(200, {
        'Success': 'User deleted successfully.'
      }))
      .catch(err => {
        const errorString = err.toString()
        errorString.includes('no such file or directory')
          ? callback(404, {
              'Error': 'User does not exist.'
            })
          : callback(500, {
              'Error': err.toString()
            })
      })
  }


module.exports = userHandler