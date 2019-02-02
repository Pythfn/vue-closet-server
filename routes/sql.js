const router = require('koa-router')()
const jwtverify = require('./utils/jwtverify')
const sc = require('../config')
router.prefix('/api')

router.post('/additem', async (ctx, next) => {
  const req = ctx.request.body
  const token = ctx.header.authorization.split(' ')[1]
  console.log(token)
  const verify = jwtverify(token, sc.jwtsecret)
  await verify.then((data) => {
    const userid = data.userid
    console.log(userid)
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