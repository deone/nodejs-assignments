const http = require('http')
const StringDecoder = require('string_decoder').StringDecoder

const { port, env } = require('./lib/config')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')
const _data = require('./lib/data')


// Testing
// @TODO: Delete this
//_data.create('test', 'newFile', {'foo': 'bar'})
// _data.read('test', 'newFile')
// _data.update('test', 'newFile', 'Aloha')
// _data.delete('test', 'newFile')


// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {

  // Get path request is sent to
  const trimmedPath = helpers.trimPath(req.url)

  // To process this request, we need a handler called thus:
  // handler(data, callback)

  // Get handler
  // Use notFound handler if we can't find a handler
  const chosenHandler =
    typeof router[trimmedPath] !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound

  // Create callback
  const callback = (statusCode, message) => {
    // set a default status code
    statusCode = typeof statusCode === 'number' ? statusCode : 200

    // create the JSON payload
    const payload = { message }

    // send a JSON response with the status code and the given message
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(statusCode)
    res.end(JSON.stringify(payload))
  }

  // read in data provided by user into variable buffer
  const decoder = new StringDecoder('utf-8')
  let buffer = ''

  req.on('data', data => (buffer += decoder.write(data)))

  // until we reach the end of it
  req.on('end', () => {
    buffer += decoder.end()

    // handle request
    chosenHandler(buffer, callback)
  })
})

const router = {
  users: handlers.users
}

// Start the server
server.listen(port, () =>
  console.log(`Running on ${env} environment on port ${port}`)
)