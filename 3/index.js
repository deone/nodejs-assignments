const url = require('url')
const http = require('http')
const { StringDecoder } = require('string_decoder')

const config = require('./lib/config')
const helpers = require('./lib/helpers')

// Handlers
const authHandler = require('./lib/handlers/auth')
const menuHandler = require('./lib/handlers/menu')
const cartHandler = require('./lib/handlers/cart')
const userHandler = require('./lib/handlers/user')
const orderHandler = require('./lib/handlers/order')
const checkoutHandler = require('./lib/handlers/checkout')

const notFoundHandler = (data, callBack) =>
  callBack(404, 'Not Found')

// HTML handler
const frontEnd = require('./lib/handlers/frontend')

const getMsgString = (message, contentType) => {
  const mediaContentTypes = [
    'favicon', 'plain', 'css', 'png', 'jpg'
  ]

  const msgStrings = {
    'json': () => JSON.stringify(
              typeof message === 'object' ? message : {}
            ),
    'html': () => typeof message === 'string' ? message : ''
  }

  return mediaContentTypes.includes(contentType)
    ? typeof message !== 'undefined' ? message : ''
    : msgStrings[contentType]()
}

// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {
  // To process this request, we need a handler called thus:
  // handler(data, callback)

  // Parse the url
  var parsedUrl = url.parse(req.url, true)

  // Get the path
  const path = parsedUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  const queryStringObject = parsedUrl.query

  // Get the HTTP method
  const method = req.method.toLowerCase()

  //Get the headers as an object
  const headers = req.headers

  // -- Callback
  const callBack = (statusCode, message, contentType) => {
    // Determine the type of response (fallback to JSON)
    contentType = typeof contentType === 'string' ? contentType : 'json'

    // set a default status code
    statusCode = typeof statusCode === 'number' ? statusCode : 200

    const headers = {
      'favicon': 'image/x-icon',
      'plain': 'text/plain',
      'css': 'text/css',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'json': 'application/json',
      'html': 'text/html'
    }

    const messageString = getMsgString(message, contentType)

    res.setHeader('Content-Type', headers[contentType])
    res.writeHead(statusCode)
    res.end(messageString)
    console.log(trimmedPath, statusCode)
  }

  // -- Handler
  // Use notFound handler if we can't find a handler
  const chosenHandler = typeof router[trimmedPath] !== 'undefined'
      ? router[trimmedPath]
      : notFoundHandler

  // read in data provided by user into variable buffer
  const decoder = new StringDecoder('utf-8')
  let buffer = ''

  req.on('data', data => (buffer += decoder.write(data)))

  // until we reach the end of it
  req.on('end', () => {
    buffer += decoder.end()

    // Construct the data object to send to the handler
    // -- Data
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)
    };

    // handle request
    chosenHandler(data, callBack)
  })
})

const router = {
  '': frontEnd.index,
  'api/user': userHandler.user,
  'api/login': authHandler.login,
  'api/logout': authHandler.logout,
  'api/menu': menuHandler.menu,
  'api/cart': cartHandler.cart,
  'api/order': orderHandler.order,
  'api/checkout': checkoutHandler.checkout
}

// Start the server
server.listen(config.port, () =>
  console.log(
    `Running on ${config.env} environment on port ${config.port}`
  )
)