/* Library for storing and editing data */

// Dependencies
const fs = require('fs')
const util = require('util')
const path = require('path')

const helpers = require('./helpers')



const lib = {}

// Base directory of data folder
lib.baseDir = path.join(__dirname,'/../.data/')

// Write data to a file
lib.create = (dir, file, data) => {
  const { openFile, writeFile, dataString } = helpers.ioTools(data)

  openFile(helpers.filePath(lib.baseDir, dir, file), 'wx')
    .then((fileDescriptor) =>
      writeFile(fileDescriptor, dataString))
    .catch((err) => console.log(err))
}

// Read data from a file
lib.read = (dir, file) => {
  const readFile = util.promisify(fs.readFile)

  readFile(helpers.filePath(lib.baseDir, dir, file), 'utf8')
    .then(console.log)
    .catch(console.error)
    /* .then((data) => {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    }).catch((err) => {
      console.log(err)
    }) */
}

// Update data in a file
lib.update = (dir, file, data) => {
  const { openFile, writeFile, dataString } = helpers.ioTools(data)

  openFile(helpers.filePath(lib.baseDir, dir, file), 'w')
    .then((fileDescriptor) =>
      writeFile(fileDescriptor, dataString))
    .catch(console.error)
}

// Delete a file
lib.delete = (dir, file, callback) => {}


// Export the module
module.exports = lib