const http = require('http')
const url = require('url')

// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {
  const trimmedPath = trimPath(req.url);

  // Send the response
  res.end('Hello World!\n')

  // Log the request/response
  console.log('Request received on path: ', trimmedPath)

})

// Start the server
server.listen(8080, () =>
  // console.log(`Running on ${env} environment on port ${port}`)
  console.log(`Running on staging environment on port 8080.`)
)

const trimPath = reqUrl => {
  const parsedUrl = url.parse(reqUrl, true);
  const path = parsedUrl.pathname;
  return path.replace(/^\/+|\/+$/g, '');
}