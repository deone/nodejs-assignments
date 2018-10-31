const http = require('http')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const { port, env } = require('./config')

// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {
  const trimmedPath = trimPath(req.url)

  // consume any data that's given and return it in the payload
  const decoder = new StringDecoder('utf-8')
  let buffer = ''

  // Read data into the buffer
  req.on('data', data => (buffer += decoder.write(data)))

  // until we reach the end of it
  req.on('end', () => {
    buffer += decoder.end()

    // Attempt to get handler
    // Use notFound handler if we can't find a handler
    const chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound

    // pass in the given data and a callback to handle the response
    chosenHandler(buffer, (statusCode, message) => {
      // set a default status code
      statusCode = typeof statusCode === 'number' ? statusCode : 200

      // create the JSON payload
      const payload = { message }

      // send a JSON response with the status code and the given message
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(JSON.stringify(payload))
    })
  })
})

// Start the server
server.listen(port, () =>
  console.log(`Running on ${env} environment on port ${port}`)
)

const trimPath = reqUrl => {
  const parsedUrl = url.parse(reqUrl, true)
  const path = parsedUrl.pathname
  return path.replace(/^\/+|\/+$/g, '')
}

const handlers = {}

handlers.notFound = (data, callback) => callback(404, 'Not Found')

handlers.hello = (data, callback) => {
  http.get('http://fortunecookieapi.herokuapp.com/v1/cookie', (resp) => {
    let cookie = ''
  
    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      cookie += chunk
    });
  
    // The whole response has been received. Return response.
    resp.on('end', () => {
      cookie = JSON.parse(cookie)[0].fortune.message
      callback(200, `Hi there. You said ${data}. Here's a cookie for you - ${cookie}`)
    });
  
  }).on("error", (err) => {
    console.log("Error: " + err.message)
  })
}

const router = {
  hello: handlers.hello
}