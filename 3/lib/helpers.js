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

helpers.cFilePath = baseDir =>
  dir =>
    fileName =>
      !fileName
        ? path.join(baseDir, dir, '/')
        : path.join(
            baseDir, dir, fileName.concat('.', 'json')
          )

helpers.baseDirFunc = helpers.cFilePath(helpers.baseDir)
helpers.userDir = helpers.baseDirFunc('users')
helpers.orderDir = helpers.baseDirFunc('orders')
helpers.tokenDir = helpers.baseDirFunc('tokens')
helpers.menuItemDir = helpers.baseDirFunc('menuitems')

// Validate email properly, maybe with regex
helpers.validate = (...data) =>
  data.map(item =>
    typeof item === 'string' && item.trim().length > 0
      ? item.trim()
      : false
  )

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
  helpers.openFile(
    helpers.filePath(
      helpers.baseDir,
      'users',
      email
    ),
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
                  {
                    'Success': `User ${{
                    'w': 'update', 'wx': 'create'
                    }[fileOpenMode]}d successfully.`
                  }
                )
        })
        .catch(err => callBack(500, {
          'Error': err.toString()
        }))
    })
    .catch(err => callBack(500, {
      'Error': err.toString()
    }))
}

const createString = (strLength, chars) =>
  Array(strLength).fill().map(i =>
    chars.charAt(
      Math.floor(Math.random() * chars.length)
    )
  ).join('')

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength =>
  createString(
    strLength,
    'abcdefghijklmnopqrstuvwxyz0123456789'
  )

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
    ? templateName
    : false

  data = typeof data === 'object' && data !== null
    ? data
    : {}

  return templateName
    ? helpers.readFile(path.join(
        helpers.templateDir, `${templateName}.html`
      ), 'utf8')
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

helpers.isTokenProvided = (tokenId, callBack) => {
  if (!tokenId) {
    callBack(401, {
      'Error': 'Authentication token not provided.'
    })
    return false
  }
  return true
}

helpers.isTokenExpired = (tokenExpiry, callBack) => {
  if (Date.now() > tokenExpiry) {
    callBack(401, {
      'Error': 'Invalid token. Please login again.'
    })
    return false
  }
  return true
}

helpers.isRequiredFieldProvided = (field, callBack) => {
  if (!field) {
    callBack(400, {
      'Error': 'Missing required field.'
    })
    return false
  }
  return true
}


module.exports = helpers