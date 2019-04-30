// Dependencies
const fs = require('fs')
const path = require('path')
const https = require('https')
const crypto = require('crypto')
const { promisify } = require('util')
const queryString = require('querystring')

const config = require('./config')

const utils = {}


/* Errors */
utils.errors = {}
utils.errors.MISSING_REQUIRED_FIELD = 'Missing required field.'
utils.errors.TOKEN_EXPIRED = 'Token has expired. Please login again.'
utils.errors.TOKEN_NOT_PROVIDED = 'Authentication token not provided.'


/* I/O */
utils.readDir = promisify(fs.readdir)
utils.readFile = promisify(fs.readFile)
utils.deleteFile = promisify(fs.unlink)
utils.writeFile = promisify(fs.writeFile)

utils.delete = dir => x => utils.deleteFile(dir(x))
utils.get = dir => x => utils.readFile(dir(x), 'utf8')
utils.getByFileName = dir =>
  x => {
    // Remove '.json' from end of string
    const item = utils.slice(0)(-5)(x)
    return utils.get(dir)(item)
  }
utils.writeUser = user =>
  utils.writeFile(utils.userDir(user.email), JSON.stringify(user))


/* Directories/Paths */
utils.filePath = baseDir =>
  dir =>
    fileName =>
      !fileName
        ? path.join(baseDir, dir, '/')
        : path.join(
            baseDir, dir, fileName.concat('.', 'json')
          )

const dataDirPath = path.join(__dirname, '/../.data/')
utils.dataDir = utils.filePath(dataDirPath)
utils.userDir = utils.dataDir('users')
utils.orderDir = utils.dataDir('orders')
utils.tokenDir = utils.dataDir('tokens')
utils.menuItemDir = utils.dataDir('menuitems')
utils.templateDir = path.join(__dirname, '/../templates/')


/* FP/Point-free utilities */
utils.map = f => xs => xs.map(f)
utils.find = f => xs => xs.find(f)
utils.filter = f => xs => xs.filter(f)
utils.forEach = f => xs => xs.forEach(f)
utils.slice = start => end => s => s.slice(start, end)
utils.compose = (...functions) => data =>
  functions.reduceRight((value, func) => func(value), data)


/* Validation */
// Validate email properly, maybe with regex
const validator = x =>
  typeof x === 'string' && x.trim().length > 0 ? x.trim() : false
utils.validate = utils.map(validator)


/* JSON to Object */
// Parse a JSON string to an object in all cases, without throwing
utils.parseJsonToObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}


/* String Operations */
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

utils.createToken = callBack =>
  email =>
    tokenId => {
      // Set an expiration date 1 hour in the future.
      const expires = Date.now() + 1000 * 60 * 60
      const token = { email, tokenId, expires }

      // Store the token
      utils.writeFile(utils.tokenDir(tokenId),
        JSON.stringify(token))
        .catch(err => callBack(500, {'Error': err.toString()}))

      return token
    }

// Create a SHA256 hash
utils.hash = str =>
  typeof str == 'string' && str.length > 0
    ? crypto.createHmac(
        'sha256',
        config.hashingSecret
      ).update(str).digest('hex')
    : false


/* Requests */
utils.requestDispatcher = callBack =>
  handlers =>
    acceptableMethods =>
      data =>
        acceptableMethods.includes(data.method)
          ? handlers[data.method](callBack)(data)
          : callBack(405)

utils.setOptions = host =>
  path =>
    auth =>
      payLoad => ({
        hostname: host,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payLoad)
        }
      })

utils.sendRequest = payLoad =>
  options =>
    callBack => {
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
      
      req.write(payLoad)
      req.end()
    }

utils.createPayLoad = token =>
  order =>
    (source = null) =>
      source
        ? queryString.stringify({
            amount: Math.round(order.totalPrice * 100),
            currency: 'usd',
            description: `${token.email}_${token.tokenId}_${Date.now()}`,
            source: source
          })
        : queryString.stringify({
            'from': `Dayo Osikoya<info@${config.mailgunDomain}>`,
            'to': 'alwaysdeone@gmail.com',
            'subject': `Order No. ${order.id}`,
            'text': `Dear ${token.email}, an order with a total amount of ${order.totalPrice} was made by you.`
          })


/* Templates */
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