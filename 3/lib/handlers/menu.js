/* Menu handler */

// Dependencies
const helpers = require('../helpers')

const menuHandler = {}

menuHandler.menu = (data, callback) =>
  helpers.requestDispatcher(
    data, callback, ['get'], menuHandler._menu)

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = (data, callBack) => {
  // Get tokenId from header
  const [tokenId] = helpers.validate(data.headers.token)

  if (!tokenId) {
    callBack(401, {'Error': 'Authentication token not provided.'})
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is valid
      if (!tokenObject.expires > Date.now()) {
        callBack(401, {'Error': 'Invalid token. Please login again.'})
        return
      }

      // Token is valid
      // Read menuitems directory
      helpers.readDir(helpers.filePath(helpers.baseDir, 'menuitems'))
        .then(fileNames => {
          if (!fileNames.length) {
            // There are no menu items
            callBack(200, {'Message': 'There are no items on the menu.'})
            return
          }

          // There are menu items
          const promises = fileNames.map(fileName => {
            // Get menu item from each file
            return helpers.readFile(
                    helpers.filePath(
                      helpers.baseDir,
                      'menuitems',
                      fileName.slice(0, -5)
                    ),
                    'utf8'
                  )
                    .then(menuItem =>
                      helpers.parseJsonToObject(menuItem))
                    .catch(err => callBack(500, {
                      'Error': err.toString()
                    }))
          })

          Promise.all(promises).then(menuItems => {
            callBack(200, menuItems)
          })

        })
        .catch(err => callBack(500, {'Error': err.toString()}))
    })
    .catch(err => callBack(500, {'Error': err.toString()}))
}


module.exports = menuHandler