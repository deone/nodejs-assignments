const http = require('http')
const StringDecoder = require('string_decoder').StringDecoder
const url = require('url')

const config = require('./lib/config')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {
  // To process this request, we need a handler called thus:
  // handler(data, callback)

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  //Get the headers as an object
  const headers = req.headers;

  // -- Callback
  const callback = (statusCode, message) => {
    // set a default status code
    statusCode = typeof statusCode === 'number' ? statusCode : 200

    // Use the payload returned from the handler, or set the default payload to an empty object
    message = typeof message == 'object' ? message : {}

    // Convert the payload to a string
    const messageString = JSON.stringify(message);

    // Return the response
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(statusCode)
    res.end(messageString)
    console.log(trimmedPath, statusCode)
  }

  // -- Handler
  // Use notFound handler if we can't find a handler
  const chosenHandler =
    typeof router[trimmedPath] !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound

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
    chosenHandler(data, callback)
  })
})

const router = {
  users: handlers.users,
  tokens: handlers.tokens
}

// Start the server
server.listen(config.port, () =>
  console.log(`Running on ${config.env} environment on port ${config.port}`)
)