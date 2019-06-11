const http = require('http')
const config = require('./../lib/config')

const helpers = {}

helpers.makeGETRequest = (path, token, callBack) => {
  // Configure options
  const options = {
    'protocol': 'http:',
    'hostname': 'localhost',
    'port': config.port,
    'method': 'GET',
    'path': path,
    'headers': {
      'token': token,
      'Content-Type' : 'application/json'
    }
  }

  // Send the request
  const req = http.request(options, res => {
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => callBack(res.statusCode, JSON.parse(body)))
  })

  req.end()
}

helpers.makePOSTRequest = (path, data, token, callBack) => {
  const options = {
    'protocol': 'http:',
    'hostname': 'localhost',
    'port': config.port,
    'method': 'POST',
    'path': path,
    'headers': {
      'token': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }

  const req = http.request(options, res => {
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => callBack(JSON.parse(body)))
  })

  req.on('error', error => console.error(error))

  req.write(data)
  req.end()
}


module.exports = helpers