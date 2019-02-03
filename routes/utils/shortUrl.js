const axios = require('axios')

module.exports = async function(url) {
  return new Promise(async (resolve, reject) => {
    const apiUrl = 'https://dwz.cn/admin/v2/create'
    const token = '0a6a5d27b9e3fdbccf16f853b7b8d2cc'
    const longUrl = {
      url
    }
    await axios.post(apiUrl, longUrl, {
      headers: {
        'Token': token
      }
    }).then((res) => {
      //  console.log(res)
      if (res.data.Code === 0) {
        resolve(res.data.ShortUrl)
      } else {
        //  如果无法转为短地址，返回原链接
        resolve(url)
      }
    }).catch((err) => {
      console.log('###SHORTURLERROR###' + err)
      reject(err)
    })
  })
}