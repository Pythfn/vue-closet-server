const shortUrl = require('./shortUrl.js')

let toShortUrl = async function(picstr, type) {
  if (type = 'single') {
    await shortUrl(picstr).then((url) => {
      return url
    })
  }
  let picarr = picstr.split(',')
  let newarr = []
  for (let i = 0; i < picarr.length; i++) {
    await shortUrl(picarr[i]).then((url) => {
      newarr.push(url)
    })
  }
  return newarr.join(',')
}

module.exports = toShortUrl