/* HTML handlers */

// Dependencies
const { io } = require('../utils')

const handlers = {}

handlers.index = (data, callBack) =>
  data.method === 'get'
    ? io.getTemplate('index', data, callBack)
        .then(string => {
          callBack(200, string, 'html')
        })
        .catch(err => callBack(500, undefined, 'html'))
    : callBack(405, undefined, 'html')

// Export the handlers
module.exports = handlers