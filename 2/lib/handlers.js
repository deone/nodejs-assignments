const handlers = {}

handlers.notFound = (data, callback) => callback(404, 'Not Found')
handlers.users = (data, callback) => callback(200, 'Take a cookie!')

module.exports = handlers