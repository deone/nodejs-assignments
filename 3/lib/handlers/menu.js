/* Menu handler */

// Dependencies
const {
  request,
  validate,
  errors,
  io,
  dir,
  json,
  fp
} = require('../utils')

const menuHandler = {}

menuHandler.menu = callBack =>
  data => {
    const dispatch =
      request.dispatch(callBack)(menuHandler._menu)
    dispatch(['get'])(data)
  }

menuHandler._menu = {}

// Menu - get
// Required data: token ID
// Optional data: none
menuHandler._menu.get = callBack =>
  data => {
    // Get tokenId from header
    const [tokenId] = validate([data.headers.token])

    if (!tokenId) {
      callBack(401, {'Error': errors.TOKEN_NOT_PROVIDED})
      return
    }

    // Get token
    io.get(dir.tokens)(tokenId)
      .then(t => {
        const token = json.toObject(t)

        // Check whether token is expired
        if (Date.now() > token.expires) {
          callBack(401, {'Error': errors.TOKEN_EXPIRED})
          return
        }

        // Read menu items directory
        io.readDir(dir.menuItems())
          .then(xs => {
            if (!xs.length) {
              // There are no menu items
              callBack(200, {
                'Message': 'There are no items on the menu.'
              })
              return
            }

            const promises = fp.map(
              io.getByFileName(dir.menuItems)
            )(xs)

            Promise.all(promises).then(ms => {
              callBack(200, fp.map(json.toObject)(ms))
            })

          })
      })
      .catch(err =>
        callBack(500, {'Error': err.toString()}))
  }


module.exports = menuHandler