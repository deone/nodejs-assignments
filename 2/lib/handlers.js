/* Request Handlers */

// Dependencies
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const helpers = require('./helpers')


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
  // firstName
  const firstName = helpers.validate(data.payload.firstName)

  // lastName
  const lastName = helpers.validate(data.payload.lastName)

  // email
  const email = helpers.validate(data.payload.email)

  // streetAddress
  const streetAddress = helpers.validate(data.payload.streetAddress)

  if(firstName && lastName && email && streetAddress) {
    const readFile = promisify(fs.readFile)
    readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')
      .then(console.log)
      .catch((err) => {
        // Create the user object
        const userObject = { firstName, lastName, email, streetAddress }

        // Store the user
        const openFile = promisify(fs.open)
        const writeFile = promisify(fs.writeFile)

        openFile(helpers.filePath(helpers.baseDir, 'users', email), 'wx')
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
  const email = helpers.validate(data.queryStringObject.email.trim())
  if(email) {
    // Look up user
  }
}

// Users - put
handlers._users.put = (data, callback) => {}

// Users - delete
handlers._users.delete = (data, callback) => {}

module.exports = handlers