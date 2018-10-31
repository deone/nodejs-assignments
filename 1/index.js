const http = require('http')

// Configure the server to respond to all requests with a string
const server = http.createServer((req, res) => {
  res.end('Hello World!\n')
})

// Start the server
server.listen(8080, () =>
  // console.log(`Running on ${env} environment on port ${port}`)
  console.log(`Running on staging environment on port 8080.`)
)