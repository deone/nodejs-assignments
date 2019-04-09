/* HTML handlers */

const path = require('path')

// Dependencies
const helpers = require('../helpers')

const handlers = {}

handlers.index = (data, callBack) =>
  data.method === 'get'
    ? helpers.getTemplate('index', data, callBack)
        .then(string => {
          callBack(200, string, 'html')
        })
        .catch(err => callBack(500, undefined, 'html'))
    : callBack(405, undefined, 'html')

// Export the handlers
module.exports = handlers