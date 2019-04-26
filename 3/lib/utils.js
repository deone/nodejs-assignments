// Dependencies
const fs = require('fs')
const path = require('path')
const https = require('https')
const { promisify } = require('util')
const crypto = require('crypto')

const config = require('./config')

const utils = {}

utils.errors = {}
utils.errors.TOKEN_NOT_PROVIDED = 'Authentication token not provided.'
utils.errors.TOKEN_EXPIRED = 'Token has expired. Please login again.'
utils.errors.MISSING_REQUIRED_FIELD = 'Missing required field.'

utils.baseDir = path.join(__dirname, '/../.data/')
utils.templateDir = path.join(__dirname, '/../templates/')

utils.openFile = promisify(fs.open)
utils.readFile = promisify(fs.readFile)
utils.writeFile = promisify(fs.writeFile)
utils.deleteFile = promisify(fs.unlink)
utils.readDir = promisify(fs.readdir)

utils.filePath = baseDir =>
  dir =>
    fileName =>
      !fileName
        ? path.join(baseDir, dir, '/')
        : path.join(
            baseDir, dir, fileName.concat('.', 'json')
          )

utils.baseDirFunc = utils.filePath(utils.baseDir)
utils.userDir = utils.baseDirFunc('users')
utils.orderDir = utils.baseDirFunc('orders')
utils.tokenDir = utils.baseDirFunc('tokens')
utils.menuItemDir = utils.baseDirFunc('menuitems')

utils.filter = f => xs => xs.filter(f)
utils.map = f => xs => xs.map(f)
utils.find = f => xs => xs.find(f)
utils.forEach = f => xs => xs.forEach(f)
utils.slice = start => end => s => s.slice(start, end)

utils.delete = dir => x => utils.deleteFile(dir(x))
utils.get = dir => x => utils.readFile(dir(x), 'utf8')
utils.getByFileName = dir =>
  x => {
    // Remove '.json' from end of string
    const item = utils.slice(0)(-5)(x)
    return utils.get(dir)(item)
  }

utils.compose = (...functions) => data =>
  functions.reduceRight((value, func) => func(value), data)

// Basically a curry-wrapped utils.writeFile
utils.fileWriter = data =>
  fd => utils.writeFile(fd, JSON.stringify(data))


// Validate email properly, maybe with regex
const validator = x =>
  typeof x === 'string' && x.trim().length > 0 ? x.trim() : false

utils.validate = utils.map(validator)

// Create a SHA256 hash
utils.hash = str =>
  typeof str == 'string' && str.length > 0
    ? crypto.createHmac(
        'sha256',
        config.hashingSecret
      ).update(str).digest('hex')
    : false

// Parse a JSON string to an object in all cases, without throwing
utils.parseJsonToObject = str => {
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
utils.createRandomString = strLength =>
  createString
    (strLength)
    ('abcdefghijklmnopqrstuvwxyz0123456789')

utils.requestDispatcher = callBack =>
  handlersContainer =>
    acceptableMethods =>
      data =>
        acceptableMethods.includes(data.method)
          ? handlersContainer[data.method](callBack)(data)
          : callBack(405)

utils.createToken = callBack =>
  email =>
    tokenId => {
      // Set an expiration date 1 hour in the future.
      const expires = Date.now() + 1000 * 60 * 60
      const tokenObject = { email, tokenId, expires }

      const write = utils.fileWriter(tokenObject)

      // Store the token
      utils.openFile(
        utils.tokenDir(tokenId),
        'wx'
      )
        .then(write)
        .then(callBack(200, tokenObject))
        .catch(err => callBack(500, {'Error': err.toString()}))
    }


// Curry these
utils.writeUser = (
  email,
  object,
  fileOpenMode,
  callBack,
  caller = 'users'
) => {
  const write = utils.fileWriter(object)
  utils.openFile(
    utils.userDir(email),
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

utils.sendRequest = (
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

utils.getTemplate = (templateName, data, callBack) => {
  templateName = typeof templateName === 'string' && templateName.length > 0
    ? templateName
    : false

  data = typeof data === 'object' && data !== null
    ? data
    : {}

  return templateName
    ? utils.readFile(path.join(
        utils.templateDir, `${templateName}.html`
      ), 'utf8')
    : callBack('A valid template name was not specified.');
}

module.exports = utils