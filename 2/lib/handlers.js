/* Request Handlers */

// Dependencies
const fs = require('fs')
const { promisify } = require('util')

const helpers = require('./helpers')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const deleteFile = promisify(fs.unlink)


const handlers = {}

handlers.notFound = (data, callback) => callback(404, 'Not Found')

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers._users = {}

// Users - post
// Required data: firstName, lastName, email, streetAddress
// Option data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const email = helpers.validate(data.payload.email)
  const streetAddress = helpers.validate(data.payload.streetAddress)

  if(firstName && lastName && email && streetAddress) {
    readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(console.log)
      .catch((err) => {
        // Create the user object
        const userObject = { firstName, lastName, email, streetAddress }

        // Store the user
        helpers.openFile(helpers.filePath(helpers.baseDir, 'users', email), 'wx')
          .then((fileDescriptor) =>
            writeFile(fileDescriptor, JSON.stringify(userObject)))
              .then(() => callback(200))
              .catch((err) => {
                console.log(err)
                callback(500, {'Error': 'Could not create the new user'})
              })
          .catch((err) => {
            console.log(err)
            callback(500, {'Error': 'Could not create the new user'})
          })
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
  if(email) {
    // Look up user
    readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then((data) => callback(200, helpers.parseJsonToObject(data)))
      .catch((err) => callback(404))
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

// Users - put
// Required data: email
// Optional data: firstName, lastName, streetAddress (at least one must be specified)
// @TODO Only let an authenticated user up their object. Dont let them access update elses.
handlers._users.put = (data, callback) => {
  // Validate required field 
  const email = helpers.validate(data.payload.email)

  // Validate optional fields, if provided
  const firstName = helpers.validate(data.payload.firstName)
  const lastName = helpers.validate(data.payload.lastName)
  const streetAddress = helpers.validate(data.payload.streetAddress)

  if(!email) {
    callback(400, {'Error': 'Missing required field'})
  } else {
    if(firstName || lastName || streetAddress) {
      readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
        .then((data) => {
          // Update fields if necessary
          const userObject = helpers.parseJsonToObject(data)

          if(firstName)
            userObject.firstName = firstName

          if(lastName)
            userObject.lastName = lastName

          if(streetAddress)
            userObject.streetAddress = streetAddress

          // Store updates
          // This block is same as lines 48 - 59
          // Exception is file mode and error messages.
          // Refactor.
          helpers.openFile(helpers.filePath(helpers.baseDir, 'users', email), 'w')
            .then((fileDescriptor) =>
              writeFile(fileDescriptor, JSON.stringify(userObject)))
                .then(() => callback(200))
                .catch((err) => {
                  console.log(err)
                  callback(500, {'Error': 'Could not update user'})
                })
            .catch((err) => {
              console.log(err)
              callback(500, {'Error': 'Could not update user'})
            })
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
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = (data, callback) => {
  // Validate email
  const email = helpers.validate(data.payload.email)
  if(email) {
    readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then((data) => {
        deleteFile(helpers.filePath(helpers.baseDir, 'users', email))
          .then(() => callback(200))
          .catch((err) => {
            console.log(err)
            callback(500, {'Error': 'Could not delete user'})
          })
      })
      .catch((err) => {
        console.log(err)
        callback(400, {'Error': 'Could not find user'})
      })
  } else {
    callback(400, {'Error': 'Missing required field'})
  }
}

module.exports = handlers