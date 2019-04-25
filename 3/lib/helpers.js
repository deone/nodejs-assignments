// Dependencies
const fs = require('fs')
const path = require('path')
const https = require('https')
const { promisify } = require('util')
const crypto = require('crypto')

const config = require('./config')

const helpers = {}

helpers.errors = {}
helpers.errors.TOKEN_NOT_PROVIDED = 'Authentication token not provided.'
helpers.errors.TOKEN_EXPIRED = 'Token has expired. Please login again.'
helpers.errors.MISSING_REQUIRED_FIELD = 'Missing required field.'

helpers.baseDir = path.join(__dirname, '/../.data/')
helpers.templateDir = path.join(__dirname, '/../templates/')

helpers.openFile = promisify(fs.open)
helpers.readFile = promisify(fs.readFile)
helpers.writeFile = promisify(fs.writeFile)
helpers.deleteFile = promisify(fs.unlink)
helpers.readDir = promisify(fs.readdir)

helpers.filePath = baseDir =>
  dir =>
    fileName =>
      !fileName
        ? path.join(baseDir, dir, '/')
        : path.join(
            baseDir, dir, fileName.concat('.', 'json')
          )

helpers.baseDirFunc = helpers.filePath(helpers.baseDir)
helpers.userDir = helpers.baseDirFunc('users')
helpers.orderDir = helpers.baseDirFunc('orders')
helpers.tokenDir = helpers.baseDirFunc('tokens')
helpers.menuItemDir = helpers.baseDirFunc('menuitems')

helpers.filter = f => xs => xs.filter(f)
helpers.map = f => xs => xs.map(f)
helpers.find = f => xs => xs.find(f)
helpers.forEach = f => xs => xs.forEach(f)

helpers.delete = dir => x => helpers.deleteFile(dir(x))
helpers.get = dir => x => helpers.readFile(dir(x), 'utf8')
helpers.getItem = dir =>
  x => {
    // Remove '.json' from end of string
    const item = x.slice(0, -5)
    return helpers.get(dir)(item)
  }

helpers.compose = (...functions) => data =>
  functions.reduceRight((value, func) => func(value), data)

// Basically a curry-wrapped helpers.writeFile
helpers.fileWriter = data =>
  fd => helpers.writeFile(fd, JSON.stringify(data))


// Validate email properly, maybe with regex
const validator = x =>
  typeof x === 'string' && x.trim().length > 0 ? x.trim() : false

helpers.validate = helpers.map(validator)

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

const createString = strLength =>
  chars =>
    Array(strLength).fill().map(i =>
      chars.charAt(
        Math.floor(Math.random() * chars.length)
      )
    ).join('')

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength =>
  createString
    (strLength)
    ('abcdefghijklmnopqrstuvwxyz0123456789')

helpers.requestDispatcher = callBack =>
  handlersContainer =>
    acceptableMethods =>
      data =>
        acceptableMethods.includes(data.method)
          ? handlersContainer[data.method](callBack)(data)
          : callBack(405)

helpers.createToken = callBack =>
  email =>
    tokenId => {
      // Set an expiration date 1 hour in the future.
      const expires = Date.now() + 1000 * 60 * 60
      const tokenObject = { email, tokenId, expires }

      const write = helpers.fileWriter(tokenObject)

      // Store the token
      helpers.openFile(
        helpers.tokenDir(tokenId),
        'wx'
      )
        .then(write)
        .then(callBack(200, tokenObject))
        .catch(err => callBack(500, {'Error': err.toString()}))
    }


// Curry these
helpers.writeUser = (
  email,
  object,
  fileOpenMode,
  callBack,
  caller = 'users'
) => {
  const write = helpers.fileWriter(object)
  helpers.openFile(
    helpers.userDir(email),
    fileOpenMode
  )
    .then(write)
    .then(
      () => {
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
      }
    )
    .catch(err => callBack(500, {'Error': err.toString()}))

}

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


module.exports = helpers