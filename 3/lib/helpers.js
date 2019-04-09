// Dependencies
const fs = require('fs')
const path = require('path')
const https = require('https')
const { promisify } = require('util')
const crypto = require('crypto')

const config = require('./config')

const helpers = {}

helpers.baseDir = path.join(__dirname, '/../.data/')
helpers.templateDir = path.join(__dirname, '/../templates/')

helpers.openFile = promisify(fs.open)
helpers.readFile = promisify(fs.readFile)
helpers.writeFile = promisify(fs.writeFile)
helpers.deleteFile = promisify(fs.unlink)
helpers.readDir = promisify(fs.readdir)

helpers.filePath = (baseDir, dir, fileName) =>
  !fileName
    ? path.join(baseDir, dir, '/')
    : path.join(baseDir, dir, fileName.concat('.', 'json'))

// Validate email properly, maybe with regex
helpers.validate = data =>
  typeof data === 'string' && data.trim().length > 0
    ? data.trim() : false

// Create a SHA256 hash
helpers.hash = str =>
  typeof str == 'string' && str.length > 0
    ? crypto.createHmac(
        'sha256',
        config.hashingSecret
      ).update(str).digest('hex')
    : false

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}

helpers.writeUser = (
  email,
  object,
  fileOpenMode,
  callBack,
  caller = 'users'
) => {
  const fileOpenActions = {
    'w': 'update',
    'wx': 'create'
  }
  const action = fileOpenActions[fileOpenMode]

  helpers.openFile(
    helpers.filePath(helpers.baseDir, 'users', email),
    fileOpenMode
  )
    .then(fileDescriptor => {
      helpers.writeFile(fileDescriptor, JSON.stringify(object))
        .then(() => {
          caller === 'cart'
            ? callBack(200, object.cart)
            : caller === 'order'
              ? callBack(200, object.orders)
              : callBack(
                  200,
                  {'Success': `User ${action}d successfully.`}
                )
        })
        .catch(err => callBack(500, {'Error': err.toString()}))
    })
    .catch(err => callBack(500, {'Error': err.toString()}))
}

const createString = strLength => {
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
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof strLength === 'number' && strLength > 0
    ? strLength : false

  return strLength
    ? createString(strLength)
    : false
}

helpers.requestDispatcher = (
  data,
  callBack,
  acceptableMethods,
  handlersContainer
) =>
  acceptableMethods.includes(data.method)
    ? handlersContainer[data.method](data, callBack)
    : callBack(405)

// User helpers
helpers.getUser = email =>
  helpers.readFile(
    helpers.filePath(helpers.baseDir, 'users', email),
    'utf8'
  )

helpers.deleteUser = email =>
  helpers.deleteFile(
    helpers.filePath(helpers.baseDir, 'users', email)
  )

// Token helpers
helpers.getToken = tokenId =>
  helpers.readFile(
    helpers.filePath(helpers.baseDir, 'tokens', tokenId),
    'utf8'
  )

helpers.createToken = (tokenId, email, callBack) => {
  // Set an expiration date 1 hour in the future.
  const expires = Date.now() + 1000 * 60 * 60
  const tokenObject = { email, tokenId, expires }

  // Store the token
  helpers.openFile(
    helpers.filePath(helpers.baseDir, 'tokens', tokenId),
    'wx'
  )
    .then(fileDescriptor =>
      helpers.writeFile(
          fileDescriptor,
          JSON.stringify(tokenObject)
        )
        .then(() =>
          callBack(200, tokenObject))
        .catch(err =>
          callBack(500, {'Error': err.toString()}))
    )
    .catch(err =>
      callBack(500, {'Error': err.toString()})
  )
}

helpers.deleteToken = tokenId =>
  helpers.deleteFile(
    helpers.filePath(helpers.baseDir, 'tokens', tokenId)
  )

helpers.sendRequest = (
  payload,
  hostName,
  path,
  auth,
  callBack
) => {
  const options = {
    hostname: hostName,
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payload)
    }
  }

  const req = https.request(options, res => {
    console.log(`Status code: ${res.statusCode}`)
  
    res.on('data', d => {
      console.log(`${d}`)
      res.statusCode === 200
        ? callBack(false)
        : callBack(true)
    })
  })
  
  req.on('error', error => console.error(error))
  
  req.write(payload)
  req.end()
}

helpers.getTemplate = (templateName, data, callBack) => {
  templateName = typeof templateName === 'string' && templateName.length > 0
    ? templateName : false
  data = typeof data === 'object' && data !== null
    ? data : {}

  return templateName
    ? helpers.readFile(path.join(helpers.templateDir, `${templateName}.html`), 'utf8')
    : callBack('A valid template name was not specified.');
}

/* helpers.getTemplate = function(templateName,data,callback){
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
}; */


module.exports = helpers