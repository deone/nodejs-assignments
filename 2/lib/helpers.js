const url = require('url')

const helpers = {}

helpers.trimPath = reqUrl => {
  const parsedUrl = url.parse(reqUrl, true)
  const path = parsedUrl.pathname
  return path.replace(/^\/+|\/+$/g, '')
}

module.exports = helpers