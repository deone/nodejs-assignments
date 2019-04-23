/* Menu handler */

// Dependencies
const helpers = require('../helpers')

const menuHandler = {}

menuHandler.menu = (data, callback) =>
  helpers.requestDispatcher(
    data, callback, ['get'], menuHandler._menu
  )

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = (data, callBack) => {
  // Get tokenId from header
  const [tokenId] = helpers.validate([data.headers.token])

  if (!helpers.isTokenProvided(
    tokenId, callBack)) {
    return
  }

  // Get token
  helpers.getToken(tokenId)
    .then(token => {
      const tokenObject = helpers.parseJsonToObject(token)

      // Check whether token is expired
      if (!helpers.isTokenExpired(
        tokenObject.expires, callBack)) {
        return
      }

      // Token is valid
      // Read menuitems directory
      helpers.readDir(helpers.menuItemDir())
        .then(fileNames => {
          if (!fileNames.length) {
            // There are no menu items
            callBack(200, {
              'Message': 'There are no items on the menu.'
            })
            return
          }

          // There are menu items
          const promises = fileNames.map(fileName => {
            // Get menu item from each file
            return helpers.readFile(
                    helpers.menuItemDir(fileName.slice(0, -5)),
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
        .catch(err => callBack(500, {
          'Error': err.toString()
        }))
    })
    .catch(err => callBack(500, {
      'Error': err.toString()
    }))
}


module.exports = menuHandler