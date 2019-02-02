const jwt = require('jsonwebtoken')

module.exports = (...args) => {
  return new Promise((resolve, reject) => {
    jwt.verify(...args, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}