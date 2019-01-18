// Dependencies
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')


const helpers = {}

helpers.baseDir = path.join(__dirname,'/../.data/')

helpers.filePath = (baseDir, dir, file) =>
  path.join(baseDir, dir, file.concat('.','json'))

// Validate email properly, maybe with regex
helpers.validate = data =>
  typeof data === 'string' && data.trim().length > 0 ? data.trim() : false

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    return JSON.parse(str)
  } catch(e) {
    return {}
  }
}

helpers.openFile = promisify(fs.open)
helpers.readFile = promisify(fs.readFile)
helpers.writeFile = promisify(fs.writeFile)
helpers.deleteFile = promisify(fs.unlink)

module.exports = helpers