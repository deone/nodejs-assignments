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
utils.io = {}
utils.io.readDir = promisify(fs.readdir)
utils.io.readFile = promisify(fs.readFile)
utils.io.deleteFile = promisify(fs.unlink)
utils.io.writeFile = promisify(fs.writeFile)

utils.io.delete = dir => x => utils.io.deleteFile(dir(x))
utils.io.get = dir => x => utils.io.readFile(dir(x), 'utf8')

utils.io.getByFileName = dir =>
  x => {
    // Remove '.json' from end of string
    const item = utils.fp.slice(0)(-5)(x)
    return utils.io.get(dir)(item)
  }

utils.io.writeUser = user =>
  utils.io.writeFile(utils.dir.users(user.email), JSON.stringify(user))

utils.io.getTemplate = (templateName, data, callBack) => {
  templateName = typeof templateName === 'string' && templateName.length > 0
    ? templateName
    : false

  data = typeof data === 'object' && data !== null
    ? data
    : {}

  return templateName
    ? utils.io.readFile(path.join(
        utils.dir.templates, `${templateName}.html`
      ), 'utf8')
    : callBack('A valid template name was not specified.');
}


/* Directories/Paths */
utils.dir = {}
utils.dir.path = baseDir =>
  dir =>
    fileName =>
      !fileName
        ? path.join(baseDir, dir, '/')
        : path.join(baseDir, dir, fileName.concat('.', 'json'))

utils.dir.data = utils.dir.path(path.join(__dirname, '/../.data/'))
utils.dir.templates = utils.dir.path(path.join(__dirname, '/../templates/'))

utils.dir.users = utils.dir.data('users')
utils.dir.orders = utils.dir.data('orders')
utils.dir.tokens = utils.dir.data('tokens')
utils.dir.menuItems = utils.dir.data('menuitems')


/* FP/Point-free utilities */
utils.fp = {}

// map :: (a -> b) -> [a] -> [b]
utils.fp.map = f => xs => xs.map(f)

// find :: (a -> Bool) -> [a] -> a
utils.fp.find = f => xs => xs.find(f)

// filter :: (a -> Bool) -> [a] -> [a]
utils.fp.filter = f => xs => xs.filter(f)

// slice :: a -> a -> String -> String
utils.fp.slice = a => b => s => s.slice(a, b)

// reduce :: (b -> a -> b) -> b -> [a] -> b
utils.fp.reduce = f => a => xs => xs.reduce(f, a)

utils.fp.forEach = f => xs => xs.forEach(f)

// compose :: [a] -> b -> b
utils.fp.compose = (...functions) => data =>
  functions.reduceRight((value, func) => func(value), data)


/* Validation */
// Validate email properly, maybe with regex
const validator = x =>
  typeof x === 'string' && x.trim().length > 0 ? x.trim() : false
utils.validate = utils.fp.map(validator)


/* JSON to Object */
// Parse a JSON string to an object in all cases, without throwing
utils.json = {}
utils.json.toObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}


/* String Operations */
utils.crypto = {}
const createString = strLength =>
  chars =>
    Array(strLength).fill().map(i =>
      chars.charAt(
        Math.floor(Math.random() * chars.length)
      )
    ).join('')

// Create a string of random alphanumeric characters, of a given length
utils.crypto.createRandomString = strLength =>
  createString(strLength)('abcdefghijklmnopqrstuvwxyz0123456789')

utils.crypto.createToken = callBack =>
  email =>
    id => {
      // Set an expiration date 1 hour in the future.
      const expires = Date.now() + 1000 * 60 * 60
      const token = { email, id, expires }

      // Store the token
      utils.io.writeFile(utils.dir.tokens(id),
        JSON.stringify(token))
        .catch(err => callBack(500, {'Error': err.toString()}))

      return token
    }

// Create a SHA256 hash
utils.crypto.hash = str =>
  crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex')


/* Requests */
utils.request = {}
utils.request.dispatch = callBack =>
  handlers =>
    acceptableMethods =>
      data =>
        acceptableMethods.includes(data.method)
          ? handlers[data.method](callBack)(data)
          : callBack(405)

utils.request.setOptions = payLoad => {
  let [host, path, auth] = [
    'api.stripe.com',
    '/v1/charges',
    `Bearer ${config.stripeKey}`
  ]

  if (payLoad.includes('mailgun')) {
    [host, path, auth] = [
      'api.mailgun.net',
      `/v3/${config.mailgunDomain}/messages`,
      'Basic ' + Buffer.from((`api:${config.mailgunKey}`)).toString('base64')
    ]
  }

  return {
    hostname: host,
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(payLoad)
    }
  }
}

utils.request.createPayLoad = token =>
  order =>
    (source = null) =>
      source
        ? queryString.stringify({
            amount: Math.round(order.totalPrice * 100),
            currency: 'usd',
            description: `${token.email}_${token.id}_${Date.now()}`,
            source: source
          })
        : queryString.stringify({
            'from': `Dayo Osikoya<info@${config.mailgunDomain}>`,
            'to': 'alwaysdeone@gmail.com',
            'subject': `Order No. ${order.id}`,
            'text': `Dear ${token.email}, an order with a total amount of ${order.totalPrice} was made by you.`
          })

utils.request.send = payLoad =>
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


module.exports = utils