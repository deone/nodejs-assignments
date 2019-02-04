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

helpers.filePath = (baseDir, dir, file) =>
  path.join(baseDir, dir, file.concat('.','json'))

// Validate email properly, maybe with regex
helpers.validate = data =>
  typeof data === 'string' && data.trim().length > 0 ? data.trim() : false

// Create a SHA256 hash
helpers.hash = (str) => {
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

helpers.fileWriter = (fileName, object, action, dir, callback) => {

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
            callback(200)
          }
        })
        .catch((err) => {
          console.log(err)
          callback(500, {'Error': `Could not ${action} record`})
        })
    .catch((err) => {
      console.log(err)
      callback(500, {'Error': `Could not ${action} record`})
    })
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false

  if(strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

    // Start the final string
    let str = ''
    for(let i = 1; i <= strLength; i++) {
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


module.exports = helpers