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
menuHandler._menu.get = (data, callback) => {
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
                callback(400, {'Error': 'There are no items on the menu'})
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
                        callback(200, menuItems)
                      }
                    })
                    .catch(err => {
                      console.log(err)
                      callback(500, {'Error': 'Unable to read menu item'})
                    })
                })
              }
            })
            .catch(err => {
              console.log(err)
              callback(500, {'Error': 'Unable to read menuitems directory'})
            })
        } else {
          callback(401, {'Error': 'Invalid token. Please login again.'})
        }
      })
      .catch(err => {
        console.log(err)
        callback(500, {'Error': 'Unable to get token'})
      })
  } else {
    callback(401, {'Error': 'Authentication token not provided'})
  }
}


module.exports = menuHandler