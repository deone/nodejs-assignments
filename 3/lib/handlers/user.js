/* User handlers */

// Dependencies
const utils = require('../utils')

const userHandler = {}

userHandler.user = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(userHandler._user)
    dispatch(['post', 'get', 'put', 'delete'])(data)
  }

// Container for user methods
userHandler._user = {}

// User - post
// Required data: firstName, lastName,
// email, streetAddress, password
// Optional data: none
userHandler._user.post = callBack =>
  data => {
    // Check that all required fields are filled out
    const [
      firstName,
      lastName,
      email,
      password,
      streetAddress
    ] = utils.validate([
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

    utils.readFile(
      utils.userDir(email),
      'utf8'
    )
      .then(u => callBack(400, {
        'Error': 'User already exists.'
      }))
      .catch(err => {
        // Hash password
        const hashedPassword = utils.hash(password)

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
          utils.writeFile(
            utils.userDir(user.email),
            JSON.stringify(user)
          )
            .then(callBack(200, {'Success': 'User created successfully.'}))
            .catch(err => callBack(500, {'Error': err.toString()}))
        }
      })
  }

// User - get
// Required data: email
// Optional data: none
// @TODO Only let an authenticated user access
// their object. Dont let them access anyone elses.
userHandler._user.get = callBack =>
  data => {
    // Validate email - do this properly, maybe with regex
    const [email] = utils.validate([data.queryStringObject.email])

    if (!email) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    // Look up user
    utils.readFile(
      utils.userDir(email),
      'utf8'
    )
      .then(u => {
        const user = utils.parseJsonToObject(u)
        delete user.hashedPassword
        callBack(200, user)
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
userHandler._user.put = callBack =>
  data => {
    // Validate required field
    const [email] = utils.validate([data.payload.email])

    // Validate optional fields, if provided
    const [
      firstName,
      lastName,
      password,
      streetAddress
    ] = utils.validate([
      data.payload.firstName,
      data.payload.lastName,
      data.payload.password,
      data.payload.streetAddress
    ])

    if (!email) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    if (!(firstName || lastName || streetAddress || password)) {
      callBack(400, {'Error': 'Missing fields to update.'})
      return
    }

    utils.get(utils.userDir)(email)
      .then(u => {
        const user = utils.parseJsonToObject(u)
        const input = { firstName, lastName, streetAddress, password }

        // Update input with hashed password
        if (input.password !== false) {
          input.hashedPassword = utils.hash(input.password)
        }

        const notPasswordField = item => item[0] !== 'password'
        const notFalse = item => item[1] !== false

        const reduce = f => x => x.reduce(f, {})
        const objectify = (obj, item) => {
          obj[item[0]] = item[1]
          return obj
        }

        // Remove password field
        // Remove fields that don't have values
        // Make object from resulting array
        const getFieldsToUpdate = utils.compose(
          reduce(objectify),
          utils.compose(
            utils.filter(notFalse),
            utils.filter(notPasswordField)
          )
        )
        const fields = getFieldsToUpdate(Object.entries(input))

        // Update fields if necessary
        Object.assign(user, fields)

        // Store updates
        utils.writeFile(
          utils.userDir(user.email),
          JSON.stringify(user)
        )
          .then(callBack(200, {'Success': 'User updated successfully.'}))
          .catch(err => callBack(500, {'Error': err.toString()}))
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
userHandler._user.delete = callBack =>
  data => {
    // Validate email
    const [email] = utils.validate([data.queryStringObject.email])

    if (!email) {
      callBack(400, {'Error': utils.errors.MISSING_REQUIRED_FIELD})
      return
    }

    utils.delete(utils.userDir)(email)
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