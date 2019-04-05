/* HTML handlers */

// Dependencies
const helpers = require('../helpers')

const handlers = {}

handlers.index = (data, callBack) => {
  callBack(undefined, undefined, 'html')
}

// Export the handlers
module.exports = handlers