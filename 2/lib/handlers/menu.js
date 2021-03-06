/* Menu handler */

// Dependencies
const helpers = require('../helpers')

const menuHandler = {}

menuHandler.menu = (data, callback) => {
  const acceptableMethods = ['get']
  return helpers.requestDispatcher(
    data, callback, acceptableMethods, menuHandler._menu)
}

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = (data, callBack) => {
  // Get tokenId from header
  const tokenId = helpers.validate(data.headers.token)
  if (tokenId) {
    // Get token
    helpers.getToken(tokenId)
      .then(token => {
        const tokenObject = helpers.parseJsonToObject(token)
        // Check whether token is valid
        if (tokenObject.expires > Date.now()) {
          // Token is valid
          // Read menuitems directory
          helpers.readDir(helpers.filePath(helpers.baseDir, 'menuitems'))
            .then(fileNames => {
              if (!fileNames.length) {
                // There are no menu items
                callBack(200, {'Message': 'There are no items on the menu.'})
              } else {
                // There are menu items
                let menuItems = []
                fileNames.forEach(fileName => {
                  // Get menu item from each file
                  helpers.readFile(
                    helpers.filePath(helpers.baseDir, 'menuitems', fileName.slice(0, -5)), 'utf8')
                    .then(menuItem => {
                      menuItems.push(helpers.parseJsonToObject(menuItem))
                      if (menuItems.length === fileNames.length) {
                        callBack(200, menuItems)
                      }
                    })
                    .catch(err => callBack(500, {'Error': err.toString()}))
                })
              }
            })
            .catch(err => callBack(500, {'Error': err.toString()}))
        } else {
          callBack(401, {'Error': 'Invalid token. Please log in again.'})
        }
      })
      .catch(err => callBack(500, {'Error': err.toString()}))
  } else {
    callBack(401, {'Error': 'Authentication token not provided.'})
  }
}


module.exports = menuHandler