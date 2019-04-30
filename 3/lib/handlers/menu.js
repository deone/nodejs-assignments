/* Menu handler */

// Dependencies
const utils = require('../utils')

const menuHandler = {}

menuHandler.menu = callBack =>
  data => {
    const dispatch =
      utils.request.dispatch(callBack)(menuHandler._menu)
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
    utils.io.get(utils.dir.tokens)(tokenId)
      .then(t => {
        const token = utils.json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': utils.errors.TOKEN_EXPIRED})
          return
        }

        // Read menu items directory
        utils.io.readDir(utils.dir.menuItems())
          .then(xs => {
            if (!xs.length) {
              // There are no menu items
              callBack(200, {
                'Message': 'There are no items on the menu.'
              })
              return
            }

            const promises = utils.fp.map(
              utils.io.getByFileName(utils.dir.menuItems)
            )(xs)

            Promise.all(promises).then(ms => {
              callBack(200, utils.fp.map(utils.json.toObject)(ms))
            })

          })
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = menuHandler