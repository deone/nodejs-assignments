/* Menu handler */

// Dependencies
const utils = require('../utils')

const menuHandler = {}

menuHandler.menu = callBack =>
  data => {
    const dispatch =
      utils.requestDispatcher(callBack)(menuHandler._menu)
    dispatch(['get'])(data)
  }

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = utils.validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': utils.errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    utils.get(utils.tokenDir)(tokenId)
      .then(t => {
        const token = utils.parseJsonToObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        // Token is valid
        // Read menuitems directory
        utils.readDir(utils.menuItemDir())
          .then(xs => {
            if (!xs.length) {
              // There are no menu items
              callBack(200, {
                'Message': 'There are no items on the menu.'
              })
              return
            }

            const promises = utils.map(
              utils.getItem(utils.menuItemDir)
            )(xs)

            Promise.all(promises).then(ms => {
              callBack(200, utils.map(utils.parseJsonToObject)(ms))
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