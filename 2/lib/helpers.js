// Dependencies
const url = require('url')
const util = require('util')
const fs = require('fs')
const path = require('path')


const helpers = {}

helpers.filePath = (baseDir, dir, file) =>
  path.join(baseDir, dir, file.concat('.','json'))

helpers.validate = data =>
  typeof(data) === 'string' && data.length > 0 ? data : false

helpers.trimPath = reqUrl => {
  const parsedUrl = url.parse(reqUrl, true)
  const path = parsedUrl.pathname
  return path.replace(/^\/+|\/+$/g, '')
}

helpers.ioTools = (data) => {
  return {
    'openFile': util.promisify(fs.open),
    'writeFile': util.promisify(fs.writeFile),
    'dataString': JSON.stringify(data),
  }
}


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str)
  } catch(e) {
    return {}
  }
}


module.exports = helpers