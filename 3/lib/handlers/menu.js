/* Menu handler */

// Dependencies
const helpers = require('../helpers')

const menuHandler = {}

menuHandler.menu = callBack =>
  data => {
    const dispatch =
      helpers.requestDispatcher(callBack)(menuHandler._menu)
    dispatch(['get'])(data)
  }

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = helpers.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': helpers.errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    helpers.get(helpers.tokenDir)(tokenId)
      .then(t => {
        const token = helpers.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': helpers.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Read menuitems directory
        helpers.readDir(helpers.menuItemDir())
          .then(xs => {
            if (!xs.length) {
              // There are no menu items
              callBack(200, {
                'Message': 'There are no items on the menu.'
              })
              return
            }

            const promises = helpers.map(
              helpers.getItem(helpers.menuItemDir)
            )(xs)

            Promise.all(promises).then(ms => {
              callBack(200, helpers.map(helpers.parseJsonToObject)(ms))
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