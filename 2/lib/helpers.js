// Dependencies
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const crypto = require('crypto')

const config = require('./config')

const helpers = {}

helpers.baseDir = path.join(__dirname,'/../.data/')

helpers.openFile = promisify(fs.open)
helpers.readFile = promisify(fs.readFile)
helpers.writeFile = promisify(fs.writeFile)
helpers.deleteFile = promisify(fs.unlink)
helpers.readDir = promisify(fs.readdir)

helpers.filePath = (baseDir, dir, fileName) => {
  if (!fileName) {
    return path.join(baseDir, dir, '/')
  } else {
    return path.join(baseDir, dir, fileName.concat('.','json'))
  }
}

// Validate email properly, maybe with regex
helpers.validate = data =>
  typeof data === 'string' && data.trim().length > 0 ? data.trim() : false

// Create a SHA256 hash
helpers.hash = str => {
  if(typeof str == 'string' && str.length > 0)
    return crypto.createHmac(
      'sha256', config.hashingSecret).update(str).digest('hex')
  return false
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}

helpers.writeObject = (fileName, object, action, dir, callback) => {

  const recordType = dir.slice(0, -1)
  const actionFileOpenMap = {
    'create': 'wx',
    'update': 'w'
  }

  helpers.openFile(helpers.filePath(helpers.baseDir, dir, fileName),
    actionFileOpenMap[action])
    .then((fileDescriptor) =>
      helpers.writeFile(fileDescriptor, JSON.stringify(object)))
        .then(() => {
          // Return token object, if we just created one
          if (action === 'create' && dir === 'tokens') {
            callback(200, object)
          } else {
            callback(200, {'Success': `User ${action}d successfully`})
          }
        })
        .catch((err) => {
          console.log(err)
          callback(500, {'Error': `Could not ${action} ${recordType}`})
        })
    .catch((err) => {
      console.log(err)
      callback(500, {'Error': `Could not ${action} ${recordType}`})
    })
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false

  if (strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

    // Start the final string
    let str = ''
    for (let i = 1; i <= strLength; i++) {
      // Get a random character from the possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length))
      // Append this character to the string
      str += randomCharacter
    }
    // Return the final string
    return str
  } else {
    return false
  }
}

helpers.requestDispatcher = (data, callback,
  acceptableMethods, handlersContainer) => {
  if (acceptableMethods.includes(data.method)) {
    handlersContainer[data.method](data, callback)
  } else {
    callback(405)
  }
}

// User helpers
helpers.getUser = email =>
  helpers.readFile(helpers.filePath(helpers.baseDir, 'users', email), 'utf8')

helpers.deleteUser = email =>
  helpers.deleteFile(helpers.filePath(helpers.baseDir, 'users', email))

// Token helpers
helpers.getToken = tokenId =>
  helpers.readFile(helpers.filePath(helpers.baseDir, 'tokens', tokenId), 'utf8')

helpers.createToken = (tokenId, email, callback) => {
  // Set an expiration date 1 hour in the future.
  const expires = Date.now() + 1000 * 60 * 60
  const tokenObject = { email, tokenId, expires }

  // Store the token
  helpers.openFile(helpers.filePath(helpers.baseDir, 'tokens', tokenId), 'wx')
    .then((fileDescriptor) => {
      helpers.writeFile(fileDescriptor, JSON.stringify(tokenObject))
        .then(() => {
          callback(200, tokenObject)
        })
        .catch((err) => {
          console.log(err)
          callback(500, {'Error': 'Unable to write to file.'})
        })
    })
    .catch((err) => {
      console.log(err)
      callback(500, {'Error': 'Unable to open file for writing.'})
    })
}

helpers.deleteToken = tokenId =>
  helpers.deleteFile(helpers.filePath(helpers.baseDir, 'tokens', tokenId))

helpers.deleteTokenById = (tokenId, callback) => {
  // Read files from tokens directory
  helpers.readDir(helpers.filePath(helpers.baseDir, 'tokens'))
    .then((data) => {
      // Get token from each token file
      data.forEach((fileName) => {
        helpers.getToken(fileName.slice(0, -5))
          .then((token) => {
            const tokenObject = helpers.parseJsonToObject(token)
            const email = tokenObject.email

            if (tokenObject.tokenId === tokenId) {
              helpers.deleteToken(email)
                .then(callback(200, {'Success': 'User logged out'}))
                .catch((err) => {
                  console.log(err)
                  callback(500, {'Error': 'Unable to log user out. Cannot delete token'})
                })
            }
          })
          .catch((err) => {
            console.log(err)
            callback(500, {'Error': 'Unable to log user out. Cannot get token'})
          })
      })
    })
    .catch((err) => {
      console.log(err)
      callback(500, {'Error': 'Unable to log user out. Cannot read directory'})
    })
}


module.exports = helpers