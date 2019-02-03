const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
router.prefix('/api')

router.post('/additem', async (ctx, next) => {
  const token = ctx.header.authorization.split(' ')[1]
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then((data) => {
    const userid = data.userid
    ctx.body = {
      code: 1,
      msg: '有效'
    }
  }).catch((err) => {
    ctx.body = {
      code: -1,
      msg: '请重新登陆'
    }
  })
})

module.exports = router