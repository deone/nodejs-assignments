const http = require('http')
const config = require('./../lib/config')

const helpers = {}

helpers.makeRequest = (method, path, payLoad, token, callBack) => {
  const options = {
    'protocol': 'http:',
    'hostname': 'localhost',
    'port': config.port,
    'method': method,
    'path': path,
    'headers': {
      'token': token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payLoad)
    }
  }

  const req = http.request(options, res => {
    let body = ''
    res.on('data', chunk => body += chunk)
    res.on('end', () => callBack(res.statusCode, JSON.parse(body)))
  })

  req.on('error', error => console.error(error))

  req.write(payLoad)
  req.end()
}


module.exports = helpers